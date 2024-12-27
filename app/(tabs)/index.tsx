import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Button,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons'; // For icons in the bottom navigation;
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlantDetails from './PlantDetails';
import AddPlantScreen from './AddPlantScreen';
import EditPlantScreen from './EditPlantScreen';
import { PlantDetailsProps, EditPlantProps, RootStackParamList } from './types';



type Plant = {
  id: string;
  name: string;
  image: any; // Varsayılan görsel için
  backgroundColor: string; // Arka plan rengi
  backgroundImage: any; // Arka plan görseli
  watering: string; // Sulama gereksinimi
  lightRequirement: string; // Işık gereksinimi
  description: string; // Bitki açıklaması
};

const Stack = createNativeStackNavigator<RootStackParamList>();


const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  // const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadPlants = async () => {
      const storedPlants = await AsyncStorage.getItem('plants');
      if (storedPlants) {
        setPlants(JSON.parse(storedPlants));
      }
    };

    const unsubscribe = navigation.addListener('focus', loadPlants);
    return unsubscribe;
  }, [navigation]);

  const renderPlant = ({ item }: { item: Plant }) => (
    <TouchableOpacity
      style={styles.plantContainer}
      onPress={() => navigation.navigate('PlantDetails', { plant: item })}
    >
      <Image source={item.image} style={styles.plantImage} />
      <Text style={styles.plantName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plants</Text>
        <Icon name="search" size={24} color="black" style={styles.searchIcon} />
      </View>

      {/* Plant List */}
      <FlatList
        data={plants}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderPlant}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNavigation}>
        <TouchableOpacity>
          <Icon name="home-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="leaf-outline" size={24} color="green" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="heart-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
      </View> */}

      <View style={styles.addPlantContainer}>
        <Button
          title="Bitki Ekle"
          onPress={() => navigation.navigate('AddPlant')} // Yeni ekranın rotasına yönlendirir
        />
      </View>
    </View>
  );
};

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="PlantDetails"
        component={PlantDetails as React.FC<PlantDetailsProps>} // Türü belirt
        options={{ title: 'Plant Details' }}
      />
      <Stack.Screen
        name="AddPlant"
        component={AddPlantScreen} // Yeni ekran navigasyona eklendi
        options={{ title: 'Add a Plant' }}
      />
      <Stack.Screen
        name="EditPlant"
        component={EditPlantScreen as React.FC<EditPlantProps>} // Türü belirt
        options={{ title: 'Edit Plant' }}
      />

    </Stack.Navigator>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  searchIcon: {
    marginRight: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  plantContainer: {
    flex: 1,
    alignItems: 'center',
    margin: 10,
  },
  plantImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1, // Çerçeve kalınlığı
    borderColor: '#000', // Siyah çerçeve
    resizeMode: 'cover',
  },
  plantName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  addPlantContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  // modalContainer: {
  //   flex: 1,
  //   backgroundColor: '#fff',
  //   padding: 16,
  // },
  // modalTitle: {
  //   fontSize: 24,
  //   fontWeight: 'bold',
  //   marginBottom: 16,
  //   textAlign: 'center',
  // },
});
