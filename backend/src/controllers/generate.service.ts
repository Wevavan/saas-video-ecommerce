import { Video } from '@/models/Video.model'
import { v4 as uuidv4 } from 'uuid'

interface GenerateVideoRequest {
  templateId: string
  productData: {
    name: string
    price: number
    images: string[]
    description?: string
  }
  settings?: Record<string, any>
  userId: string
}

interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  duration: number
  settings: Record<string, any>
}

interface GenerationStatus {
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  videoId?: string
  error?: string
}

class GenerateService {
  private jobs: Map<string, GenerationStatus> = new Map()

  async startVideoGeneration(request: GenerateVideoRequest): Promise<string> {
    const jobId = uuidv4()

    // Créer l'entrée vidéo
    const video = new Video({
      title: `Vidéo ${request.productData.name}`,
      description: request.productData.description,
      templateId: request.templateId,
      settings: request.settings,
      userId: request.userId,
      status: 'processing'
    })

    await video.save()

    // Initialiser le job
    this.jobs.set(jobId, {
      jobId,
      status: 'processing',
      progress: 0,
      videoId: video._id.toString()
    })

    // Simuler la génération (remplacez par votre logique réelle)
    this.simulateVideoGeneration(jobId, video._id.toString())

    return jobId
  }

  async getGenerationStatus(jobId: string, userId: string): Promise<GenerationStatus | null> {
    const status = this.jobs.get(jobId)
    
    if (!status) {
      return null
    }

    // Vérifier que la vidéo appartient à l'utilisateur
    if (status.videoId) {
      const video = await Video.findOne({ _id: status.videoId, userId })
      if (!video) {
        return null
      }
    }

    return status
  }

  async getAvailableTemplates(): Promise<Template[]> {
    // Simuler des templates (remplacez par votre logique réelle)
    return [
      {
        id: 'template-1',
        name: 'Template Produit Standard',
        description: 'Template idéal pour présenter un produit avec images et prix',
        thumbnail: 'https://example.com/template1.jpg',
        duration: 30,
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          animationStyle: 'fade'
        }
      },
      {
        id: 'template-2',
        name: 'Template E-commerce Dynamique',
        description: 'Template avec animations avancées pour l\'e-commerce',
        thumbnail: 'https://example.com/template2.jpg',
        duration: 45,
        settings: {
          backgroundColor: '#f0f0f0',
          textColor: '#333333',
          animationStyle: 'slide'
        }
      }
    ]
  }

  private async simulateVideoGeneration(jobId: string, videoId: string): Promise<void> {
    const status = this.jobs.get(jobId)
    if (!status) return

    // Simuler la progression
    const intervals = [25, 50, 75, 100]
    
    for (const progress of intervals) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Attendre 2 secondes
      
      const currentStatus = this.jobs.get(jobId)
      if (!currentStatus) return

      currentStatus.progress = progress
      this.jobs.set(jobId, currentStatus)

      if (progress === 100) {
        // Marquer comme terminé
        currentStatus.status = 'completed'
        
        // Mettre à jour la vidéo en base
        await Video.findByIdAndUpdate(videoId, {
          status: 'completed',
          url: `https://example.com/videos/${videoId}.mp4`,
          thumbnail: `https://example.com/thumbnails/${videoId}.jpg`,
          duration: 30
        })
      }
    }
  }
}

export const generateService = new GenerateService()