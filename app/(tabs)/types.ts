import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  PlantDetails: { plant: Plant };
  AddPlant: undefined;
  EditPlant: { plant: Plant };
};

export interface Plant {
  id: string;
  name: string;
  image: any;
  backgroundColor: string;
  backgroundImage: any;
  watering: string;
  humidity: number;
  lightRequirement: string;
  description: string;
  addedAt: string;
  logs?: { icon: string; message: string; timestamp: string }[]; // Add logs for plant actions
}


export interface PlantDetailsProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlantDetails'>;
  route: RouteProp<RootStackParamList, 'PlantDetails'>;
}

export interface EditPlantProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditPlant'>;
  route: RouteProp<RootStackParamList, 'EditPlant'>;
}
