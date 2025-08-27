// frontend/src/pages/dashboard/Generate.tsx

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle, 
  Play,
  AlertCircle,
  Sparkles,
  Clock,
  Users,
  Tag,
  RefreshCw
} from 'lucide-react';
import { ImageUpload } from '../../components/upload/ImageUpload';
import { UploadedImage } from '../../types/upload.types';

// Types pour les données du formulaire
interface ProductInfo {
  name: string;
  description: string;
  price: string;
  targetAudience: string;
  category: string;
}

interface GenerationSettings {
  style: 'moderne' | 'luxe' | 'jeune' | 'professionnel' | 'b2b';
  duration: number;
  voiceType: 'homme-fr' | 'femme-fr' | 'homme-en' | 'femme-en';
  backgroundMusic: boolean;
}

interface FormData {
  images: UploadedImage[];
  productInfo: ProductInfo;
  settings: GenerationSettings;
}

const STEPS = [
  { 
    id: 1, 
    title: 'Images & Produit', 
    description: 'Uploadez vos images et décrivez votre produit',
    icon: <Sparkles className="w-5 h-5" />
  },
  { 
    id: 2, 
    title: 'Style & Voix', 
    description: 'Choisissez le style et la voix-off',
    icon: <Play className="w-5 h-5" />
  },
  { 
    id: 3, 
    title: 'Génération', 
    description: 'Lancez la création de votre vidéo',
    icon: <CheckCircle className="w-5 h-5" />
  }
];

const STYLES = [
  {
    id: 'moderne' as const,
    name: 'Moderne',
    description: 'Design contemporain avec animations fluides',
    preview: '🎨',
    bestFor: 'Tech, Mode, Lifestyle',
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'luxe' as const,
    name: 'Luxe',
    description: 'Élégant et sophistiqué avec transitions dorées',
    preview: '✨',
    bestFor: 'Bijoux, Cosmétiques, Premium',
    color: 'from-yellow-500 to-orange-400'
  },
  {
    id: 'jeune' as const,
    name: 'Jeune/TikTok',
    description: 'Dynamique et viral pour les réseaux sociaux',
    preview: '🔥',
    bestFor: 'Mode jeune, Gaming, Social',
    color: 'from-pink-500 to-purple-400'
  },
  {
    id: 'professionnel' as const,
    name: 'Professionnel',
    description: 'Corporate et sobre pour un public business',
    preview: '💼',
    bestFor: 'Services, Corporate, B2B',
    color: 'from-gray-600 to-gray-400'
  },
  {
    id: 'b2b' as const,
    name: 'B2B/Tech',
    description: 'Interface high-tech avec éléments de données',
    preview: '⚡',
    bestFor: 'SaaS, Logiciels, Tech B2B',
    color: 'from-emerald-500 to-teal-400'
  }
];

export const Generate: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    images: [],
    productInfo: {
      name: '',
      description: '',
      price: '',
      targetAudience: '',
      category: ''
    },
    settings: {
      style: 'moderne',
      duration: 15,
      voiceType: 'femme-fr',
      backgroundMusic: true
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sauvegarde automatique dans le localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('video-generation-draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData((prev: FormData) => ({ ...prev, ...parsed }));
        console.log('📄 Brouillon chargé depuis le localStorage');
      } catch (e) {
        console.error('Erreur parsing draft:', e);
      }
    }
  }, []);

  // Auto-save toutes les 30 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('video-generation-draft', JSON.stringify(formData));
      setLastSaved(new Date());
      console.log('💾 Brouillon sauvegardé automatiquement');
    }, 30000);

    return () => clearInterval(timer);
  }, [formData]);

  // Gestion des images uploadées
  const handleImagesUploaded = (images: UploadedImage[]) => {
    setFormData((prev: FormData) => ({
      ...prev,
      images: [...prev.images, ...images]
    }));
  };

  // Gestion de la suppression d'images
  const handleImageRemoved = (filename: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      images: prev.images.filter((img: UploadedImage) => img.filename !== filename)
    }));
  };

  // Validation des étapes
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.images.length > 0 && 
               formData.productInfo.name.trim() !== '' && 
               formData.productInfo.description.trim() !== '';
      case 2:
        return formData.settings.style !== undefined;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const getStepValidationMessage = (step: number): string => {
    switch (step) {
      case 1:
        if (formData.images.length === 0) return 'Ajoutez au moins une image';
        if (!formData.productInfo.name.trim()) return 'Renseignez le nom du produit';
        if (!formData.productInfo.description.trim()) return 'Ajoutez une description';
        return '';
      case 2:
        if (!formData.settings.style) return 'Choisissez un style';
        return '';
      default:
        return '';
    }
  };

  // Navigation entre étapes
  const goToStep = (step: number) => {
    if (step < currentStep || isStepValid(currentStep)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Mise à jour des données
  const updateProductInfo = (field: keyof ProductInfo, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        [field]: value
      }
    }));
  };

  const updateSettings = (field: keyof GenerationSettings, value: any) => {
    setFormData((prev: FormData) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  // Sauvegarde manuelle
  const saveDraft = () => {
    localStorage.setItem('video-generation-draft', JSON.stringify(formData));
    setLastSaved(new Date());
    // TODO: Également sauvegarder sur le serveur
    alert('Brouillon sauvegardé !');
  };

  // Lancement de la génération
  const startGeneration = async () => {
    setIsGenerating(true);
    try {
      console.log('🎬 Génération lancée avec:', formData);
      // TODO: Appel API génération
      
      // Simulation pour la démo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      alert('Génération lancée avec succès ! Vous recevrez une notification quand la vidéo sera prête.');
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors du lancement de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const getCreditCost = (duration: number): number => {
    switch (duration) {
      case 10: return 2;
      case 15: return 3;
      case 30: return 5;
      default: return 3;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header avec titre et sauvegarde */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Créer une vidéo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Transformez vos images produit en vidéo marketing engageante
          </p>
          {lastSaved && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              <Save className="w-4 h-4 inline mr-1" />
              Dernière sauvegarde: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={saveDraft}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Sauvegarder
        </button>
      </div>

      {/* Stepper moderne */}
      <div className="relative mb-12">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex flex-col items-center cursor-pointer group transition-all duration-300 ${
                  step.id <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                }`}
                onClick={() => goToStep(step.id)}
              >
                <div className={`
                  relative w-12 h-12 rounded-full border-3 flex items-center justify-center font-semibold transition-all duration-300 group-hover:scale-110
                  ${step.id < currentStep 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white shadow-lg' 
                    : step.id === currentStep
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 text-gray-400 group-hover:border-gray-400'
                  }
                `}>
                  {step.id < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.icon
                  )}
                  
                  {step.id === currentStep && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"></div>
                  )}
                </div>
                
                <div className="mt-3 text-center max-w-[120px]">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">{step.description}</p>
                </div>
                
                {/* Indicateur d'erreur */}
                {step.id > currentStep && !isStepValid(step.id - 1) && step.id - 1 === currentStep && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-1 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      <span>{getStepValidationMessage(currentStep)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Ligne de connexion */}
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                  step.id < currentStep 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Étape 1: Upload et info produit */}
        {currentStep === 1 && (
          <div className="p-8 space-y-8">
            {/* Section Upload d'images */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Images de votre produit
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Uploadez des images haute qualité de votre produit
                  </p>
                </div>
              </div>
              
              <ImageUpload 
                onImagesUploaded={handleImagesUploaded}
                onImageRemoved={handleImageRemoved}
                maxFiles={10}
                initialImages={formData.images}
                showGallery={true}
                showPreview={true}
                className="mb-6"
              />
              
              {/* Résumé des images */}
              {formData.images.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                          {formData.images.length} image(s) prête(s)
                        </span>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Vos images sont optimisées pour la génération vidéo
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Taille totale
                      </div>
                      <div className="font-semibold text-green-800 dark:text-green-200">
                        {(formData.images.reduce((total: number, img: UploadedImage) => total + img.size, 0) / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section Informations produit */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Informations produit
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Décrivez votre produit pour personnaliser la vidéo
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Nom du produit *
                    </label>
                    <input
                      type="text"
                      value={formData.productInfo.name}
                      onChange={(e) => updateProductInfo('name', e.target.value)}
                      placeholder="Ex: iPhone 15 Pro Max"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Prix
                    </label>
                    <input
                      type="text"
                      value={formData.productInfo.price}
                      onChange={(e) => updateProductInfo('price', e.target.value)}
                      placeholder="Ex: 1199€"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Users className="w-4 h-4 inline mr-2" />
                      Public cible
                    </label>
                    <select
                      value={formData.productInfo.targetAudience}
                      onChange={(e) => updateProductInfo('targetAudience', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="jeunes-adultes">Jeunes adultes (18-35)</option>
                      <option value="adultes">Adultes (35-55)</option>
                      <option value="seniors">Seniors (55+)</option>
                      <option value="professionnels">Professionnels</option>
                      <option value="families">Familles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Catégorie
                    </label>
                    <select
                      value={formData.productInfo.category}
                      onChange={(e) => updateProductInfo('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="tech">Technologie</option>
                      <option value="mode">Mode & Accessoires</option>
                      <option value="beaute">Beauté & Cosmétiques</option>
                      <option value="maison">Maison & Décoration</option>
                      <option value="sport">Sport & Fitness</option>
                      <option value="autres">Autres</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Description *
                  </label>
                  <textarea
                    value={formData.productInfo.description}
                    onChange={(e) => updateProductInfo('description', e.target.value)}
                    placeholder="Décrivez les caractéristiques principales et avantages de votre produit. Plus votre description est détaillée, plus la vidéo sera personnalisée..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    {formData.productInfo.description.length}/500 caractères
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Style et paramètres */}
        {currentStep === 2 && (
          <div className="p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Style de votre vidéo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choisissez l'ambiance qui correspond à votre marque
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => updateSettings('style', style.id)}
                    className={`
                      relative cursor-pointer rounded-2xl p-6 transition-all duration-300 hover:scale-105 border-2
                      ${formData.settings.style === style.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-xl'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 hover:shadow-lg'
                      }
                    `}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.color} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                      {style.preview}
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {style.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {style.description}
                    </p>
                    
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full inline-block">
                      {style.bestFor}
                    </div>
                    
                    {formData.settings.style === style.id && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Durée de la vidéo
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { value: 10, label: '10 secondes', cost: 2, desc: 'Parfait pour les stories et posts rapides' },
                      { value: 15, label: '15 secondes', cost: 3, desc: 'Idéal pour Instagram et TikTok' },
                      { value: 30, label: '30 secondes', cost: 5, desc: 'Format long pour YouTube et Facebook' }
                    ].map((option) => (
                      <label 
                        key={option.value} 
                        className={`
                          flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02]
                          ${formData.settings.duration === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            value={option.value}
                            checked={formData.settings.duration === option.value}
                            onChange={(e) => updateSettings('duration', parseInt(e.target.value))}
                            className="w-4 h-4 text-blue-600 mr-4"
                          />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {option.desc}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600 dark:text-blue-400">
                            {option.cost} crédits
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Voix-off et audio
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type de voix
                      </label>
                      <select
                        value={formData.settings.voiceType}
                        onChange={(e) => updateSettings('voiceType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      >
                        <option value="femme-fr">🇫🇷 Voix féminine française</option>
                        <option value="homme-fr">🇫🇷 Voix masculine française</option>
                        <option value="femme-en">🇺🇸 Voix féminine anglaise</option>
                        <option value="homme-en">🇺🇸 Voix masculine anglaise</option>
                      </select>
                    </div>

                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings.backgroundMusic}
                          onChange={(e) => updateSettings('backgroundMusic', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded mr-3"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Ajouter une musique de fond
                          </span>
                          <p className="text-sm text-gray-500">
                            Ambiance musicale adaptée à votre style
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Génération */}
        {currentStep === 3 && (
          <div className="p-8 text-center space-y-8">
            <div>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Prêt à générer votre vidéo !
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Vérifiez vos paramètres ci-dessous, puis lancez la génération. 
                Votre vidéo sera prête dans quelques minutes.
              </p>
            </div>

            {/* Résumé détaillé */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 text-left max-w-2xl mx-auto">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 text-center">
                Récapitulatif de votre vidéo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Produit</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{formData.productInfo.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Images</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{formData.images.length} fichier(s)</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Style</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {STYLES.find(s => s.id === formData.settings.style)?.name}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Durée</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{formData.settings.duration} secondes</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Voix</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formData.settings.voiceType.includes('fr') ? 'Français' : 'Anglais'} - 
                      {formData.settings.voiceType.includes('femme') ? ' Féminine' : ' Masculine'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Coût</div>
                    <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                      {getCreditCost(formData.settings.duration)} crédits
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={startGeneration}
              disabled={isGenerating}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xl font-semibold transform hover:scale-105 shadow-xl"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Génération en cours...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Play className="w-6 h-6" />
                  <span>Générer la vidéo</span>
                </div>
              )}
            </button>
            
            <p className="text-sm text-gray-500">
              La génération prend généralement 2-5 minutes selon la complexité
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium
            ${currentStep === 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          Précédent
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">
            Étape {currentStep} sur {STEPS.length}
          </span>
          <div className="flex gap-1 ml-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={nextStep}
          disabled={currentStep === STEPS.length || !isStepValid(currentStep)}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium transform hover:scale-105
            ${currentStep === STEPS.length || !isStepValid(currentStep)
              ? 'text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
            }
          `}
        >
          Suivant
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};