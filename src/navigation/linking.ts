import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

// Deep linking configuration
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://'], // URL scheme
  config: {
    screens: {
      Home: '',  // myapp:// -> Home
      Product: 'product/:id',  // myapp://product/123 -> Product with id=123
      Profile: 'profile/:userId',  // myapp://profile/john -> Profile with userId=john
      Settings: 'settings',  // myapp://settings -> Settings
    },
  },
};
