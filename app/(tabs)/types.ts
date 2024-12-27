import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  PlantDetails: { plant: Plant };
  AddPlant: undefined;
  EditPlant: { plant: Plant };
};

export interface Plant {
  [x: string]: any;
  id: string;
  name: string;
  image: ReturnType<typeof require>;
  backgroundColor: string;
  backgroundImage: ReturnType<typeof require>;
  watering: string;
  lightRequirement: string;
  description: string;
}

export interface PlantDetailsProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlantDetails'>;
  route: RouteProp<RootStackParamList, 'PlantDetails'>;
}

export interface EditPlantProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditPlant'>;
  route: RouteProp<RootStackParamList, 'EditPlant'>;
}
