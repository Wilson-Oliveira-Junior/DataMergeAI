from django.core.mail import EmailMessage
import tempfile
import json
import random
import pandas as pd
import os
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from .models import Version, ChatMessage, ExcelFile
from .serializers import VersionSerializer, ChatMessageSerializer, ExcelFileSerializer

# Endpoint para exportar e enviar planilha por e-mail
@api_view(['POST'])
def exportar_enviar_email(request):
    data = request.data.get('data')
    to_email = request.data.get('to_email')
    sheet_name = request.data.get('sheet_name', 'Planilha')
    if not data or not to_email:
        return Response({'error': 'Dados ou e-mail de destino ausentes.'}, status=400)
    try:
        # Converte dados para Excel temporario
        arr = json.loads(data)
        df = pd.DataFrame(arr)
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False)
            tmp.seek(0)
            email = EmailMessage(
                subject=f'Planilha exportada - {sheet_name}',
                body='Segue em anexo a planilha exportada do DataMergeAI.',
                to=[to_email]
            )
            email.attach(f'{sheet_name}.xlsx', tmp.read(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            email.send()
        return Response({'success': True})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# ViewSet para historico de versoes
class VersionViewSet(viewsets.ModelViewSet):
    queryset = Version.objects.all()
    serializer_class = VersionSerializer

# ViewSet para chat
class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer

    @action(detail=False, methods=['post'])
    def clear(self, request):
        ChatMessage.objects.all().delete()
        return Response({'success': True, 'detail': 'Chat limpo!'}, status=204)
    
    def destroy(self, request, *args, **kwargs):
        ChatMessage.objects.all().delete()
        return Response({'success': True, 'detail': 'Chat limpo!'}, status=204)

    def perform_create(self, serializer):
        # Save user message
        instance = serializer.save()
        # Bot response phrases
        bot_phrases = [
            'Recebido! Como posso ajudar?',
            'Sua mensagem foi registrada.',
            'Ola! Precisa de algo mais?',
            'Processando sua solicitacao...',
            'Mensagem recebida com sucesso.'
        ]
        ChatMessage.objects.create(
            user='Bot',
            message=random.choice(bot_phrases)
        )

class ExcelFileUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, format=None):
        files = request.FILES.getlist('file')
        if not files:
            return Response({'error': 'Nenhum arquivo enviado.'}, status=status.HTTP_400_BAD_REQUEST)

        dataframes = []
        file_infos = []
        columns_by_file = []
        for f in files:
            excel_file = ExcelFile.objects.create(file=f)
            file_path = excel_file.file.path
            try:
                print(f"📁 Processando arquivo: {f.name}")
                df = pd.read_excel(file_path)
                print(f"📊 Arquivo carregado: {len(df)} linhas x {len(df.columns)} colunas")
                
                # Verificar se a planilha é muito grande
                if len(df) > 10000:
                    print(f"⚠️ Planilha muito grande: {len(df)} linhas")
                
                df_clean = df.drop_duplicates()  # Nao remove linhas vazias automaticamente
                print(f"🧹 Após limpeza: {len(df_clean)} linhas")
                
                dataframes.append(df_clean)
                file_infos.append({
                    'id': excel_file.id,
                    'file': excel_file.file.url,
                    'uploaded_at': excel_file.uploaded_at,
                    'columns': list(df_clean.columns),
                    'rows': len(df_clean),
                    'original_rows': len(df),
                    'duplicates_removed': len(df) - len(df_clean)
                })
                columns_by_file.append(set(df_clean.columns))
                print(f"✅ Arquivo processado com sucesso: {f.name}")
            except Exception as e:
                print(f"❌ Erro ao processar {f.name}: {str(e)}")
                file_infos.append({'error': str(e), 'file': f.name})
                columns_by_file.append(set())

        # Sugerir colunas de merge (presentes em mais de um arquivo)
        all_columns = [col for cols in columns_by_file for col in cols]
        suggested_merge_cols = []
        for col in set(all_columns):
            if sum([col in cols for cols in columns_by_file]) > 1:
                suggested_merge_cols.append(col)

        merged_preview = None
        merge_report = None
        merge_columns = []
        merged_file_path = None
        if len(dataframes) >= 2 and suggested_merge_cols:
            merge_col = suggested_merge_cols[0]
            merge_columns = suggested_merge_cols
            # Merge seguro (outer join)
            merged = pd.merge(dataframes[0], dataframes[1], on=merge_col, how='outer', suffixes=('_1', '_2'), indicator=True)
            merged_preview = merged.head(5).to_dict(orient='records')
            # Relatorio do merge
            added = merged[merged['_merge'] == 'right_only'].shape[0]
            removed = merged[merged['_merge'] == 'left_only'].shape[0]
            matched = merged[merged['_merge'] == 'both'].shape[0]
            merge_report = {
                'coluna_usada': merge_col,
                'linhas_adicionadas': int(added),
                'linhas_removidas': int(removed),
                'linhas_casadas': int(matched),
                'total_resultante': int(merged.shape[0]),
            }
            # Salvar arquivo Excel do merge
            export_dir = os.path.join(os.path.dirname(file_path), 'exports')
            os.makedirs(export_dir, exist_ok=True)
            merged_file_path = os.path.join(export_dir, f'merged_result_{merge_col}.xlsx')
            merged.to_excel(merged_file_path, index=False)

        return Response({
            'arquivos': file_infos,
            'colunas_sugeridas_para_merge': suggested_merge_cols,
            'coluna_usada_no_merge': merge_report['coluna_usada'] if merge_report else None,
            'relatorio_merge': merge_report,
            'preview_merged': merged_preview,
            'arquivo_merged_salvo_em': merged_file_path,
        }, status=status.HTTP_201_CREATED)
