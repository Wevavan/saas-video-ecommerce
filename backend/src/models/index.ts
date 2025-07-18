export { User, type IUser } from './User.model'
export { Video, type IVideo } from './Video.model'
export { Subscription, type ISubscription } from './Subscription.model'
export { CreditTransaction, ICreditTransaction } from './CreditTransaction.model';

// Fonction pour initialiser tous les modèles
export const initializeModels = () => {
  console.log('📊 Modèles Mongoose initialisés:')
  console.log('   - User')
  console.log('   - Video') 
  console.log('   - Subscription')
  console.log('   - CreditTransaction')
}