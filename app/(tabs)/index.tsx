import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Button,
  Alert,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons'; // For icons in the bottom navigation;
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlantDetails from './PlantDetails';
import AddPlantScreen from './AddPlantScreen';
import EditPlantScreen from './EditPlantScreen';
import { PlantDetailsProps, EditPlantProps, RootStackParamList } from './types';
import { Plant } from './types'; // Adjust the path if `types.ts` is in a different location
import WaterTank from './WaterTank';
import mqtt from 'mqtt';
import 'react-native-url-polyfill/auto';






const Stack = createNativeStackNavigator<RootStackParamList>();


const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLightOn, setIsLightOn] = useState(false);
  const [disabledWateringButtons, setDisabledWateringButtons] = useState<string[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>(plants);
  const [client, setClient] = useState<any>(null); // MQTT istemcisi için state


  useEffect(() => {
    const connectMqtt = () => {
      const mqttClient = mqtt.connect('wss://ee264bbda6f847bfbd2b0e24d60d56b9.s1.eu.hivemq.cloud:8884/mqtt', {
        username: 'mobilApp', // HiveMQ Cloud kullanıcı adınız
        password: 'mobilApp1', // HiveMQ Cloud şifreniz
        reconnectPeriod: 1000, // Otomatik yeniden bağlanma süresi (ms)
        clean: true, // Temiz oturum
        protocol: 'wss', // WebSocket protokolü
      });

      mqttClient.on('connect', () => {
        console.log('MQTT Bağlantısı Başarılı');
      });

      mqttClient.on('error', (err) => {
        console.error('MQTT Bağlantı Hatası: ', err);
        mqttClient.end();
      });

      setClient(mqttClient);
    };

    connectMqtt();

    return () => {
      client?.end(); // Bileşen unmount olduğunda bağlantıyı kapat
    };
  }, []);


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

  const toggleGlobalLight = () => {
    const newLightState = !isLightOn;
    setIsLightOn(newLightState);

    if (client) {
      const message = newLightState
        ? 'Işık açıldı' // Eğer ışık açıldıysa bu mesaj gönderilecek
        : 'Işık kapatıldı'; // Eğer ışık kapandıysa bu mesaj gönderilecek

      client.publish('smartfarm/light', JSON.stringify({ message })); // Mesajı gönder
    }

    Alert.alert('Işık Durumu', `Işık ${!isLightOn ? 'açıldı' : 'kapatıldı'}.`);
  };

  const handleWaterPlant = async (plantId: string) => {
    const timestamp = new Date().toLocaleString();
    const newLog = { icon: 'water-outline', message: 'Sulama yapıldı', timestamp };

    const storedPlants = await AsyncStorage.getItem('plants');
    if (storedPlants) {
      const plants = JSON.parse(storedPlants);

      // Sulanan bitkinin adını bul
      const plant = plants.find((p: Plant) => p.id === plantId);
      const plantName = plant ? plant.name : 'Bilinmeyen Bitki';

      // Update the selected plant's log
      const updatedPlants = plants.map((plant: Plant) =>
        plant.id === plantId
          ? {
            ...plant,
            logs: [newLog, ...(plant.logs || []).slice(0, 4)], // Add the new log
          }
          : plant
      );

      await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
      setPlants(updatedPlants); // Update state

      if (client) {
        const message = `Bitki (${plantName}) sulandı`; // Sulama mesajı
        client.publish('smartfarm/watering', JSON.stringify({ message, timestamp })); // Mesaj ve zaman bilgisi gönder
      }

      // Temporarily disable the button for 6 seconds
      setDisabledWateringButtons((prev) => [...prev, plantId]);
      setTimeout(() => {
        setDisabledWateringButtons((prev) => prev.filter((id) => id !== plantId));
      }, 6000);

      Alert.alert('Sulama Yapıldı', 'Bitki başarıyla sulandı.');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();
    const filtered = plants.filter((plant) =>
      plant.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredPlants(filtered);
  };

  const toggleSearchMode = () => {
    if (isSearchActive) {
      setSearchQuery(''); // Clear search query when exiting search mode
      setFilteredPlants(plants); // Reset filtered plants
    }
    setIsSearchActive((prev) => !prev);
  };


  useEffect(() => {
    setFilteredPlants(plants);
  }, [plants]);







  const renderPlant = ({ item }: { item: Plant }) => (
    <View style={styles.plantContainer}>
      <TouchableOpacity
        style={styles.plantWrapper}
        onPress={() => navigation.navigate('PlantDetails', { plant: item })}
      >
        <Image source={item.image} style={styles.plantImage} />
        <Text style={styles.plantName}>{item.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.wateringButton}
        onPress={() => handleWaterPlant(item.id)}
        disabled={disabledWateringButtons.includes(item.id)} // Disable for 6 seconds
      >
        <Icon
          name={disabledWateringButtons.includes(item.id) ? 'checkmark-circle-outline' : 'water-outline'}
          size={20}
          color={disabledWateringButtons.includes(item.id) ? 'green' : '#1e90ff'}
        />
      </TouchableOpacity>
      {/* Nem Oranı Gösterimi */}
      <View style={styles.moistureContainer}>
        <Text style={styles.moistureText}>{item.watering}</Text>
      </View>
    </View>
  );




  return (
    <View style={styles.container}>
      {/* Su Tankı Barı */}
      <WaterTank tankLevel={85} />

      {/* Header */}
      <View style={styles.header}>
        {!isSearchActive ? (
          <>
            <Text style={styles.headerTitle}>Plants</Text>
            <TouchableOpacity style={styles.searchIcon} onPress={toggleSearchMode}>
              <Icon name="search" size={24} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <TextInput
            style={styles.searchInput}
            placeholder="Search plants..."
            value={searchQuery}
            onChangeText={handleSearch}
            onBlur={toggleSearchMode} // Close search on blur
          />
        )}
      </View>

      <TouchableOpacity style={styles.lightToggleButton} onPress={toggleGlobalLight}>
        <Icon
          name={isLightOn ? 'bulb' : 'bulb-outline'}
          size={24}
          color={isLightOn ? 'yellow' : 'white'}
        />
      </TouchableOpacity>


      {/* Plant List */}
      <FlatList
        data={filteredPlants}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderPlant}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={{ justifyContent: 'space-around' }} // Evenly distribute plant items
      />

      <TouchableOpacity style={styles.addPlantContainer} onPress={() => navigation.navigate('AddPlant')}>
        <Icon
          name="add-circle-outline" // Change the icon to represent adding a plant
          size={24} // Keep the size
          color="green" // Use a color to indicate the action
        />
      </TouchableOpacity>
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
    backgroundColor: '#c6e2ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#fff', // Arka plan beyaz yapıldı
    borderTopWidth: 1,
    borderTopColor: '#ccc', // Alt çizgi rengi
    borderBottomWidth: 1, // Alt çizgi ekledik
    borderBottomColor: '#ccc', // Alt çizgi rengi
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  searchIcon: {
    position: 'absolute',
    top: 4,
    right: 10,
    padding: 10,
    borderRadius: 40,
    backgroundColor: '#4285F4',
    borderWidth: 1,
    borderColor: '#778899',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    paddingHorizontal: 16,
    alignItems: 'center', // Center items horizontally
    justifyContent: 'center', // Center items vertically if needed
    flexGrow: 1, // Ensures the list takes up remaining space
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    position: 'relative', // Allows positioning for the watering button
    padding: 10, // Adds space around the plant
    borderWidth: 0, // Optional border for visual distinction
    borderColor: '#E8E8E8', // Light border color
    borderRadius: 80, // Makes the container circular or oval
  },
  plantWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#fff',
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
    position: 'absolute', // Ensure absolute positioning
    bottom: 16, // Align to the bottom
    right: 16, // Align to the right
    padding: 12,
    borderRadius: 50, // Circular appearance
    backgroundColor: '#f3f3f3', // Light background
    borderWidth: 1,
    borderColor: '#778899',
    elevation: 3, // Shadow for Android
    zIndex: 10, // Keep it above other elements
  },

  lightToggleButton: {
    position: 'absolute',
    bottom: 16, // Distance from the bottom of the screen
    left: 16, // Distance from the left side of the screen
    padding: 12,
    borderRadius: 50,
    backgroundColor: '#708090',
    borderWidth: 1,
    borderColor: '#778899',
    elevation: 3, // Adds a shadow effect
    zIndex: 10,
  },

  wateringButton: {
    position: 'absolute',
    top: 15, // Aligns to the top of the circular border
    left: 152,
    transform: [{ translateX: -35 }, { translateY: -12 }], // Moves slightly outside the border
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  moistureContainer: {
    position: 'absolute',
    top: 35, // Sulama butonunun altına yerleştirme
    left: 170, // Sulama butonuyla hizalama
    transform: [{ translateX: -35 }], // Merkezi hizalama
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 35,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 1,
  },
  moistureText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e90ff', // Nem oranı için dikkat çeken bir renk
  },

});
