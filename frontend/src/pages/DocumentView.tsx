import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  FileText, 
  Clock, 
  User, 
  Building,
  Tag,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { useApi } from '../hooks/useApi'

interface DocumentData {
  id: string
  file_name: string
  doc_type: string
  status: string
  summary_text: string
  summary_bilingual: {
    english: string
    malayalam: string
  }
  metadata: any
  department_assigned: string
  department_suggested: string
  created_at: string
  downloadUrl: string
  ocr_text: string
  processing_metadata: any
}

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { apiCall } = useApi()
  
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'malayalam'>('english')
  const [reprocessing, setReprocessing] = useState(false)

  useEffect(() => {
    if (id) {
      fetchDocument()
    }
  }, [id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await apiCall(`/documents/${id}`)
      setDocument(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const handleReprocess = async () => {
    if (!document || user?.publicMetadata?.role !== 'admin') return

    try {
      setReprocessing(true)
      await apiCall(`/documents/${document.id}/reprocess`, { method: 'POST' })
      // Refresh document data
      await fetchDocument()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprocess document')
    } finally {
      setReprocessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      uploaded: 'text-blue-600 bg-blue-100',
      processing: 'text-yellow-600 bg-yellow-100',
      processed: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading document</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate('/documents')}
          className="mt-4 btn-primary"
        >
          Back to Documents
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/documents')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{document.file_name}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                {document.status}
              </span>
              {document.doc_type && (
                <span className="text-sm text-gray-500">
                  {document.doc_type}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <a
            href={document.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
          
          {user?.publicMetadata?.role === 'admin' && (
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              className="btn-primary flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${reprocessing ? 'animate-spin' : ''}`} />
              <span>Reprocess</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h3>
            <div className="bg-gray-100 rounded-lg p-4 h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  <a
                    href={document.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Click to view full document
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Uploaded {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Department: {document.department_assigned || document.department_suggested || 'Unassigned'}
                </span>
              </div>
              
              {document.doc_type && (
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Type: {document.doc_type}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {document.summary_text && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                {document.summary_bilingual && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setSelectedLanguage('english')}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedLanguage === 'english'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setSelectedLanguage('malayalam')}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedLanguage === 'malayalam'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ML
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700">
                {document.summary_bilingual?.[selectedLanguage] || document.summary_text}
              </p>
            </div>
          )}

          {/* Metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Data</h3>
              <div className="space-y-2">
                {Object.entries(document.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-sm text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Info */}
          {document.processing_metadata && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Info</h3>
              <div className="space-y-2 text-xs text-gray-600">
                {document.processing_metadata.model_versions && (
                  <div>
                    <span className="font-medium">Models:</span>
                    <ul className="ml-2 mt-1">
                      {Object.entries(document.processing_metadata.model_versions).map(([model, version]) => (
                        <li key={model}>• {model}: {String(version)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {document.processing_metadata.confidence_scores && (
                  <div>
                    <span className="font-medium">Confidence:</span>
                    <ul className="ml-2 mt-1">
                      {Object.entries(document.processing_metadata.confidence_scores).map(([metric, score]) => (
                        <li key={metric}>• {metric}: {Math.round(Number(score) * 100)}%</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OCR Text (Collapsible) */}
      {document.ocr_text && (
        <div className="card">
          <details>
            <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-4">
              Extracted Text
            </summary>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {document.ocr_text}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}