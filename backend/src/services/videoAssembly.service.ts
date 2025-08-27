import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class VideoAssemblyService {
  private static ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

  static async combineVideoAudio(
    videoPath: string, 
    audioPath: string, 
    style: string
  ): Promise<string> {
    try {
      console.log('🎬 Assemblage vidéo + audio:', { videoPath, audioPath, style });

      const outputFilename = `final_${Date.now()}_${Math.random().toString(36).substr(2, 8)}.mp4`;
      const outputPath = path.join(process.cwd(), 'uploads', outputFilename);

      // Vérifier que les fichiers existent
      try {
        await fs.access(videoPath);
        await fs.access(audioPath);
      } catch (error) {
        console.warn('⚠️ Fichiers source manquants, création placeholder');
        return this.createPlaceholderVideo(style);
      }

      // Commande FFmpeg pour assembler vidéo + audio
      const command = `${this.ffmpegPath} -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`;

      console.log('🔧 Commande FFmpeg:', command);

      try {
        const { stdout, stderr } = await execAsync(command);
        console.log('✅ Assemblage réussi:', outputFilename);
        
        if (stderr) {
          console.log('📋 FFmpeg logs:', stderr);
        }

        return outputPath;
      } catch (ffmpegError: any) {
        console.error('❌ Erreur FFmpeg:', ffmpegError.message);
        return this.createPlaceholderVideo(style);
      }

    } catch (error: any) {
      console.error('❌ Erreur assemblage:', error.message);
      return this.createPlaceholderVideo(style);
    }
  }

  static async addBackgroundMusic(
    videoPath: string, 
    musicPath: string, 
    volume: number = 0.2
  ): Promise<string> {
    try {
      const outputFilename = `music_${Date.now()}.mp4`;
      const outputPath = path.join(process.cwd(), 'uploads', outputFilename);

      const command = `${this.ffmpegPath} -i "${videoPath}" -i "${musicPath}" -filter_complex "[1:a]volume=${volume}[bg];[0:a][bg]amix=inputs=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac "${outputPath}" -y`;

      await execAsync(command);
      console.log('✅ Musique de fond ajoutée');
      return outputPath;

    } catch (error: any) {
      console.error('❌ Erreur ajout musique:', error.message);
      return videoPath; // Retourner vidéo originale si échec
    }
  }

  static async addTextOverlay(
    videoPath: string, 
    text: string, 
    style: string,
    position: string = 'center'
  ): Promise<string> {
    try {
      const outputFilename = `overlay_${Date.now()}.mp4`;
      const outputPath = path.join(process.cwd(), 'uploads', outputFilename);

      // Configuration style texte selon le style vidéo
      const textStyles = {
        moderne: "fontcolor=white:fontsize=48:fontfile=/System/Library/Fonts/Arial.ttf",
        luxe: "fontcolor=gold:fontsize=44:fontfile=/System/Library/Fonts/Times.ttf", 
        jeune: "fontcolor=yellow:fontsize=52:fontfile=/System/Library/Fonts/Arial.ttf",
        professionnel: "fontcolor=white:fontsize=40:fontfile=/System/Library/Fonts/Arial.ttf",
        b2b: "fontcolor=lightblue:fontsize=42:fontfile=/System/Library/Fonts/Arial.ttf"
      };

      const selectedStyle = textStyles[style as keyof typeof textStyles] || textStyles.moderne;
      
      const command = `${this.ffmpegPath} -i "${videoPath}" -vf "drawtext=text='${text.replace(/'/g, "\\'")}':${selectedStyle}:x=(w-text_w)/2:y=(h-text_h)/2" "${outputPath}" -y`;

      await execAsync(command);
      console.log('✅ Overlay texte ajouté');
      return outputPath;

    } catch (error: any) {
      console.error('❌ Erreur overlay texte:', error.message);
      return videoPath;
    }
  }

  static async optimizeForWeb(inputPath: string, outputPath?: string): Promise<string> {
    try {
      const finalOutputPath = outputPath || inputPath.replace('.mp4', '_optimized.mp4');

      // Optimisation web : H.264, taille réduite, compatible mobile
      const command = `${this.ffmpegPath} -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" "${finalOutputPath}" -y`;

      await execAsync(command);
      console.log('✅ Vidéo optimisée pour web');
      return finalOutputPath;

    } catch (error: any) {
      console.error('❌ Erreur optimisation web:', error.message);
      return inputPath;
    }
  }

  private static async createPlaceholderVideo(style: string): Promise<string> {
    try {
      console.log('🎨 Création vidéo placeholder:', style);

      const outputFilename = `placeholder_${style}_${Date.now()}.mp4`;
      const outputPath = path.join(process.cwd(), 'uploads', outputFilename);

      // Couleurs selon le style
      const colors = {
        moderne: 'blue',
        luxe: 'gold', 
        jeune: 'lime',
        professionnel: 'navy',
        b2b: 'gray'
      };

      const color = colors[style as keyof typeof colors] || 'blue';

      // Créer une vidéo placeholder colorée de 10 secondes
      const command = `${this.ffmpegPath} -f lavfi -i color=c=${color}:size=1080x1920:duration=10 -c:v libx264 -pix_fmt yuv420p "${outputPath}" -y`;

      await execAsync(command);
      console.log('✅ Vidéo placeholder créée');
      return outputPath;

    } catch (error: any) {
      console.error('❌ Erreur création placeholder:', error.message);
      return '/tmp/placeholder.mp4';
    }
  }

  static async getServiceHealth(): Promise<any> {
    try {
      const { stdout } = await execAsync(`${this.ffmpegPath} -version`);
      const version = stdout.split('\n')[0];

      return {
        status: 'healthy',
        version: version,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: 'FFmpeg non disponible',
        timestamp: new Date()
      };
    }
  }
}

export const videoAssemblyService = VideoAssemblyService;