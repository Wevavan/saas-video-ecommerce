import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Play } from 'lucide-react';
import { ImageUpload } from '../../components/upload/ImageUpload';
import { UploadedImage } from '../../hooks/useUpload';

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
  { id: 1, title: 'Images & Produit', description: 'Uploadez vos images et décrivez votre produit' },
  { id: 2, title: 'Style & Voix', description: 'Choisissez le style et la voix-off' },
  { id: 3, title: 'Génération', description: 'Lancez la création de votre vidéo' }
];

const STYLES = [
  {
    id: 'moderne' as const,
    name: 'Moderne',
    description: 'Couleurs vives, transitions rapides, look contemporain',
    preview: '/previews/moderne.mp4',
    bestFor: 'Tech, Mode, Sport'
  },
  {
    id: 'luxe' as const,
    name: 'Luxe',
    description: 'Élégant, transitions douces, couleurs dorées',
    preview: '/previews/luxe.mp4',
    bestFor: 'Bijoux, Cosmétiques, Premium'
  },
  {
    id: 'jeune' as const,
    name: 'Jeune/TikTok',
    description: 'Dynamique, couleurs pop, cuts rapides',
    preview: '/previews/jeune.mp4',
    bestFor: 'Mode jeune, Gaming, Social'
  },
  {
    id: 'professionnel' as const,
    name: 'Professionnel',
    description: 'Sobre, corporate, transitions fluides',
    preview: '/previews/professionnel.mp4',
    bestFor: 'Services, Corporate, B2B'
  },
  {
    id: 'b2b' as const,
    name: 'B2B/Tech',
    description: 'Géométrique, données, couleurs tech',
    preview: '/previews/b2b.mp4',
    bestFor: 'SaaS, Logiciels, Tech B2B'
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

  // Sauvegarde automatique dans le localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('video-generation-draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData((prev: FormData) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Erreur parsing draft:', e);
      }
    }
  }, []);

  // Auto-save toutes les 5 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem('video-generation-draft', JSON.stringify(formData));
    }, 5000);

    return () => clearInterval(timer);
  }, [formData]);

  // Gestion des images uploadées
  const handleImagesUploaded = (images: UploadedImage[]) => {
    setFormData((prev: FormData) => ({
      ...prev,
      images: [...prev.images, ...images]
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

  // Suppression d'une image
//   const removeImage = (filename: string) => {
//     setFormData((prev: FormData) => ({
//       ...prev,
//       images: prev.images.filter((img: UploadedImage) => img.filename !== filename)
//     }));
//   };

  // Sauvegarde manuelle
  const saveDraft = () => {
    localStorage.setItem('video-generation-draft', JSON.stringify(formData));
    // TODO: Également sauvegarder sur le serveur
    alert('Brouillon sauvegardé !');
  };

  // Lancement de la génération
  const startGeneration = () => {
    console.log('Génération lancée avec:', formData);
    // TODO: Appel API génération
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header avec titre et sauvegarde */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Créer une vidéo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Transformez vos images produit en vidéo marketing engageante
          </p>
        </div>
        <button
          onClick={saveDraft}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Sauvegarder
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`flex items-center cursor-pointer ${
                step.id <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
              }`}
              onClick={() => goToStep(step.id)}
            >
              <div className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold
                ${step.id < currentStep 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : step.id === currentStep
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 text-gray-400'
                }
              `}>
                {step.id < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.id
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Contenu des étapes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Étape 1: Upload et info produit */}
        {currentStep === 1 && (
          <div className="space-y-8">
            {/* Section Upload d'images */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Images de votre produit
              </h2>
              
              {/* Composant Upload intégré */}
              <ImageUpload 
                onImagesUploaded={handleImagesUploaded}
                maxFiles={5}
                initialImages={formData.images}
                showGallery={true}
                className="mb-6"
              />
              
              {/* Résumé rapide des images */}
              {formData.images.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {formData.images.length} image(s) prête(s) pour la génération
                      </span>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {(formData.images.reduce((total: number, img: UploadedImage) => total + img.size, 0) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section Informations produit */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Informations produit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={formData.productInfo.name}
                    onChange={(e) => updateProductInfo('name', e.target.value)}
                    placeholder="Ex: iPhone 15 Pro Max"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prix
                  </label>
                  <input
                    type="text"
                    value={formData.productInfo.price}
                    onChange={(e) => updateProductInfo('price', e.target.value)}
                    placeholder="Ex: 1199€"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.productInfo.description}
                    onChange={(e) => updateProductInfo('description', e.target.value)}
                    placeholder="Décrivez les caractéristiques principales et avantages de votre produit..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Public cible
                  </label>
                  <select
                    value={formData.productInfo.targetAudience}
                    onChange={(e) => updateProductInfo('targetAudience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.productInfo.category}
                    onChange={(e) => updateProductInfo('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
            </div>
          </div>
        )}

        {/* Étape 2: Style et paramètres */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Choisissez le style de votre vidéo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => updateSettings('style', style.id)}
                    className={`
                      relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-lg
                      ${formData.settings.style === style.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {style.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {style.description}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Idéal pour : {style.bestFor}
                    </p>
                    {formData.settings.style === style.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Durée de la vidéo
                </h3>
                <div className="space-y-3">
                  {[
                    { value: 10, label: '10 secondes', cost: '2 crédits' },
                    { value: 15, label: '15 secondes', cost: '3 crédits' },
                    { value: 30, label: '30 secondes', cost: '5 crédits' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value={option.value}
                        checked={formData.settings.duration === option.value}
                        onChange={(e) => updateSettings('duration', parseInt(e.target.value))}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-gray-900 dark:text-white">{option.label}</span>
                        <span className="text-sm text-gray-500 ml-2">({option.cost})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Voix-off
                </h3>
                <select
                  value={formData.settings.voiceType}
                  onChange={(e) => updateSettings('voiceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
                >
                  <option value="femme-fr">Voix féminine française</option>
                  <option value="homme-fr">Voix masculine française</option>
                  <option value="femme-en">Voix féminine anglaise</option>
                  <option value="homme-en">Voix masculine anglaise</option>
                </select>

                <div className="mt-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.settings.backgroundMusic}
                      onChange={(e) => updateSettings('backgroundMusic', e.target.checked)}
                      className="mr-3"
                    />
                    <span className="text-gray-900 dark:text-white">
                      Ajouter une musique de fond
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Génération */}
        {currentStep === 3 && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Prêt à générer votre vidéo !
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Vérifiez vos paramètres avant de lancer la génération
              </p>
            </div>

            {/* Résumé */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Résumé</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Produit :</span> {formData.productInfo.name}</p>
                <p><span className="font-medium">Images :</span> {formData.images.length} fichier(s)</p>
                <p><span className="font-medium">Style :</span> {STYLES.find(s => s.id === formData.settings.style)?.name}</p>
                <p><span className="font-medium">Durée :</span> {formData.settings.duration} secondes</p>
                <p><span className="font-medium">Voix :</span> {formData.settings.voiceType}</p>
                <p><span className="font-medium">Coût :</span> {formData.settings.duration === 10 ? 2 : formData.settings.duration === 15 ? 3 : 5} crédits</p>
              </div>
            </div>

            <button
              onClick={startGeneration}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Générer la vidéo
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${currentStep === 1 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <span className="text-sm text-gray-500">
          Étape {currentStep} sur {STEPS.length}
        </span>

        <button
          onClick={nextStep}
          disabled={currentStep === STEPS.length || !isStepValid(currentStep)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${currentStep === STEPS.length || !isStepValid(currentStep)
              ? 'text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          Suivant
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};