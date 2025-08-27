import OpenAI from 'openai';

interface ProductInfo {
  name: string;
  description: string;
  price: number;
  category: string;
  targetAudience: string;
}

export class OpenAIService {
  private static client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  static async generateMarketingScript(
    productInfo: ProductInfo, 
    style: string, 
    duration: number
  ): Promise<string> {
    try {
      console.log('🤖 Génération script OpenAI:', { product: productInfo.name, style, duration });

      const stylePrompts = {
        moderne: "ton dynamique et innovant, vocabulaire tendance",
        luxe: "ton élégant et raffiné, vocabulaire premium",
        jeune: "ton décontracté et énergique, langage jeune",
        professionnel: "ton sérieux et crédible, vocabulaire business",
        b2b: "ton expert et technique, focus ROI et bénéfices"
      };

      const targetWords = Math.floor(duration * 2.5); // ~2.5 mots par seconde
      const selectedStyle = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.moderne;

      const prompt = `
Crée un script de vidéo marketing de ${duration} secondes (environ ${targetWords} mots) pour ce produit e-commerce :

**PRODUIT :**
- Nom : ${productInfo.name}
- Description : ${productInfo.description}
- Prix : ${productInfo.price}€
- Catégorie : ${productInfo.category}
- Public cible : ${productInfo.targetAudience}

**STYLE DEMANDÉ :** ${selectedStyle}

**CONTRAINTES :**
- Exactement ${targetWords} mots maximum
- Commencer par un hook accrocheur (3-4 mots)
- Présenter le produit et ses bénéfices clés
- Finir par un call-to-action fort
- Optimisé pour voix-off (pas de texte compliqué)
- Adapté au public : ${productInfo.targetAudience}

Retourne UNIQUEMENT le script, sans introduction ni explication.
`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Plus économique que GPT-4
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en copywriting e-commerce. Tu crées des scripts vidéo marketing ultra-efficaces et concis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(targetWords * 2, 500), // Limite de sécurité
        temperature: 0.8, // Créativité modérée
      });

      const script = response.choices[0]?.message?.content?.trim() || '';
      
      if (!script) {
        throw new Error('Aucun script généré par OpenAI');
      }

      console.log('✅ Script généré:', { longueur: script.length, mots: script.split(' ').length });
      return script;

    } catch (error: any) {
      console.error('❌ Erreur OpenAI:', error.message);
      
      // Fallback avec template de base
      return this.getFallbackScript(productInfo, style, duration);
    }
  }

  private static getFallbackScript(productInfo: ProductInfo, style: string, duration: number): string {
    const templates = {
      moderne: `Découvrez ${productInfo.name} ! ${productInfo.description} À seulement ${productInfo.price}€. L'innovation à portée de main !`,
      luxe: `${productInfo.name}, l'excellence incarnée. ${productInfo.description} Un investissement de ${productInfo.price}€ pour l'exceptionnel.`,
      jeune: `${productInfo.name} c'est le feu ! ${productInfo.description} Seulement ${productInfo.price}€, fonce !`,
      professionnel: `${productInfo.name} : la solution professionnelle. ${productInfo.description} ${productInfo.price}€ pour optimiser votre performance.`,
      b2b: `${productInfo.name} transforme votre business. ${productInfo.description} ROI garanti pour ${productInfo.price}€.`
    };

    const fallback = templates[style as keyof typeof templates] || templates.moderne;
    console.log('⚠️ Utilisation du script fallback');
    return fallback;
  }

  static async getServiceHealth(): Promise<any> {
    try {
      // Test simple avec OpenAI
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });

      return {
        status: 'healthy',
        model: 'gpt-4o-mini',
        timestamp: new Date(),
        testResponse: !!response.choices[0]?.message?.content
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

export const openaiService = OpenAIService;