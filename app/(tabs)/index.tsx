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
import { Plant } from './types'; // Adjust the path if types.ts is in a different location
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
  const [tankLevel, setTankLevel] = useState<number>(0); // Su tankı seviyesi için state
  const [lowMoisturePlants, setLowMoisturePlants] = useState<string[]>([]);
  const [isPumpOn, setIsPumpOn] = useState(false); // Pompa durumu
  const [wateringInProgress, setWateringInProgress] = useState<string | null>(null); // Sulama işlemi takibi
  const [notifiedPlantIds, setNotifiedPlantIds] = useState<string[]>([]);
  const [retryPlantIds, setRetryPlantIds] = useState<string[]>([]); // To store plantId that requires retry





  const showNotification = (title, message) => {
    Alert.alert(title, message);
  };

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
        mqttClient.subscribe('plant/#', (err) => {
          if (err) {
            console.error('Abonelik Hatası:', err);
          } else {
            console.log('plant/# konusuna başarıyla abone olundu.');
          }
        });
        mqttClient.subscribe('tank/level', (err) => {
          if (err) {
            console.error('Tank seviyesi abonelik hatası:', err);
          } else {
            console.log('tank/level konusuna başarıyla abone olundu.');
          }
        });

        mqttClient.subscribe('light/control', (err) => {
          if (err) {
            console.error('Abonelik Hatası:', err);
          } else {
            console.log('light/control konusuna başarıyla abone olundu.');
          }
        });

        mqttClient.subscribe('plant/light', (err) => {
          if (err) {
            console.error('Abonelik Hatası:', err);
          } else {
            console.log('plant/light konusuna başarıyla abone olundu.');
          }
        });
      });



      mqttClient.on('message', async (topic, message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());

          if (topic === 'light/control') {
            const { action } = parsedMessage;
            if (action === 'on') {
              setIsLightOn(true); // Işık durumunu aç
            } else if (action === 'off') {
              setIsLightOn(false); // Işık durumunu kapat
            }
          }

          if (topic === 'plant/light') { // Işık sensörü verisini alan konu
            const { plantId, light } = parsedMessage;
            handleLightComparison(plantId, light); // Karşılaştırma yap
          }

          // Eğer 'plantId' içeren bir mesaj geldiyse
          if (topic.startsWith('plant/humidity')) {
            const { plantId, humidity } = parsedMessage;

            // Ekli bitkileri kontrol et
            const storedPlants = await AsyncStorage.getItem('plants');
            if (storedPlants) {
              const plants = JSON.parse(storedPlants);
              const plantExists = plants.some((plant) => plant.id === plantId);

              if (!plantExists) {
                // Eğer bitki mevcut değilse, yeni bir saksı plotu algılandı bildirimi göster
                handleNewPlantNotification(plantId);
              } else {
                // Bitki varsa, nem seviyesini güncelle
                handlePlantHumidityUpdate(plantId, humidity);
              }
            }
          } else if (topic === 'tank/level') {
            const { level } = parsedMessage;
            handleTankLevelUpdate(level);
          }
        } catch (err) {
          console.error('Mesaj işleme hatası:', err);
        }
      });

      // mqttClient.on('error', (err) => {
      //   console.error('MQTT Bağlantı Hatası: ', err);
      //   mqttClient.end();
      // });

      setClient(mqttClient);
    };

    connectMqtt();

    return () => {
      client?.end(); // Bileşen unmount olduğunda bağlantıyı kapat
    };
  }, []);

  useEffect(() => {
    const checkMoistureLevels = async () => {
      const storedPlants = await AsyncStorage.getItem('plants');
      if (storedPlants) {
        const plants: Plant[] = JSON.parse(storedPlants);
        const lowMoisture = plants
          .filter(
            (plant) =>
              plant.humidity < parseInt(plant.watering.replace('%', ''), 10) // Nem seviyesi sulama ihtiyacından düşükse
          )
          .map((plant) => plant.id);
        setLowMoisturePlants(lowMoisture); // Düşük nem seviyeli bitkilerin ID'lerini kaydediyoruz
      }
    };

    const unsubscribe = navigation.addListener('focus', checkMoistureLevels);
    return unsubscribe;
  }, [navigation]);




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

  useEffect(() => {
    const loadTankLevel = async () => {
      const storedLevel = await AsyncStorage.getItem('tankLevel');
      if (storedLevel) {
        setTankLevel(parseInt(storedLevel, 10)); // Son kaydedilen su seviyesi yüklenir
      }
    };

    loadTankLevel();
  }, []);

  useEffect(() => {
    const sendWateringThresholds = async () => {
      const storedPlants = await AsyncStorage.getItem('plants');
      if (storedPlants) {
        const plants: Plant[] = JSON.parse(storedPlants);

        plants.forEach((plant) => {
          const wateringThreshold = parseInt(plant.watering.replace('%', ''), 10);
          const message = JSON.stringify({ plantId: plant.id, threshold: wateringThreshold });

          if (client) {
            client.publish('plant/threshold', message);
            console.log('Threshold sent for Plant ID ${plant.id}:', message);
          } else {
            console.error('MQTT client is not connected.');
          }
        });
      }
    };

    sendWateringThresholds();
  }, [client]); // plants değiştiğinde tetiklenir




  const handleNewPlantNotification = async (plantId: string) => {
    // Check if the plantId is already in the notified list
    if (notifiedPlantIds.includes(plantId)) {
      return; // Do not show notification if already notified
    }

    // If not, show the notification
    Alert.alert('Yeni Saksı Plotu Algılandı', `Yeni bitki ID: ${plantId} algılandı.`);

    // Update the notified plantIds state
    setNotifiedPlantIds((prev) => [...prev, plantId]);

    // Start retrying every 30 seconds for the plantId
    startRetryForMissingPlant(plantId);
  };

  const startRetryForMissingPlant = (plantId: string) => {
    // Add plantId to the retry list if it's not already there
    if (!retryPlantIds.includes(plantId)) {
      setRetryPlantIds((prev) => [...prev, plantId]);
    }

    // Retry every 30 seconds
    const retryInterval = setInterval(async () => {
      // Check if the plantId has been added to the plants list
      const storedPlants = await AsyncStorage.getItem('plants');
      if (storedPlants) {
        const plants = JSON.parse(storedPlants);
        const plantExists = plants.some((plant) => plant.id === plantId);

        if (plantExists) {
          // Stop retrying when the plant is found
          clearInterval(retryInterval);
          setRetryPlantIds((prev) => prev.filter((id) => id !== plantId)); // Remove from retry list
          console.log(`Plant ID ${plantId} has been added. Stopping retry.`);
        } else {
          // If plant is still missing, show the retry message
          console.log(`Retrying for Plant ID: ${plantId}`);
          Alert.alert('Yeni Saksı Plotu Algılandı', `Yeni bitki ID: ${plantId} hala eklenmedi. Tekrar deniyorum.`);
        }
      }
    }, 30000); // Retry every 30 seconds
  };



  const handleLightComparison = async (plantId: string, lightValue: number) => {
    try {
      // Normalize lightValue from 100-150 lux to 0-100%
      const normalizedLightValue = ((lightValue - 50) / 100) * 100;

      const storedPlants = await AsyncStorage.getItem('plants');
      const plants: Plant[] = storedPlants ? JSON.parse(storedPlants) : [];

      const plant = plants.find((p) => p.id === plantId);
      if (!plant) {
        console.error('Plant not found:', plantId);
        return;
      }

      const lightRequirement = parseInt(plant.lightRequirement.replace('%', ''), 10);

      // Işık değeri ışık gereksiniminden düşükse ışığı aç
      if (normalizedLightValue < lightRequirement) {
        console.log('Işık açılıyor: Plant ID ${plantId}');
        setIsLightOn(true);
        client.publish('light/control', JSON.stringify({ plantId, action: 'on' }));
      } else {
        console.log('Işık kapalı kalacak: Plant ID ${plantId}');
        setIsLightOn(false);
        if (client) {
          client.publish('light/control', JSON.stringify({ plantId, action: 'off' })); // Işık kapatma komutu gönder
        }
      }
    } catch (err) {
      console.error('Error during light comparison:', err);
    }
  };




  const handleTankLevelUpdate = (level) => {
    setTankLevel(level);
    AsyncStorage.setItem('tankLevel', level.toString()); // Su seviyesi kaydedilir
  };

  useEffect(() => {
    const loadPlantHumidity = async () => {
      const storedPlants = await AsyncStorage.getItem('plants');
      if (storedPlants) {
        const parsedPlants = JSON.parse(storedPlants);
        setPlants(parsedPlants); // Son kaydedilen bitki bilgileri yüklenir
      }
    };

    loadPlantHumidity();
  }, []);

  const moistureAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moistureAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(moistureAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePlantHumidityUpdate = (plantId, humidity) => {
    setPlants((prevPlants) =>
      prevPlants.map((plant) =>
        plant.id === plantId ? { ...plant, humidity } : plant
      )
    );

    AsyncStorage.getItem('plants').then((storedPlants) => {
      const plants = storedPlants ? JSON.parse(storedPlants) : [];
      const updatedPlants = plants.map((plant) =>
        plant.id === plantId ? { ...plant, humidity } : plant
      );
      AsyncStorage.setItem('plants', JSON.stringify(updatedPlants)); // Güncellenen bitki bilgileri kaydedilir

      // Nem seviyesi kontrolü
      const lowMoisture = updatedPlants
        .filter(
          (plant) =>
            plant.humidity < parseInt(plant.watering.replace('%', ''), 10)
        )
        .map((plant) => plant.id);
      setLowMoisturePlants(lowMoisture);
    });
  };



  const toggleGlobalLight = () => {
    const newLightState = !isLightOn;
    setIsLightOn(newLightState);

    if (client) {
      const action = newLightState ? 'on' : 'off';
      client.publish('light/control', JSON.stringify({ action }));
    }

    Alert.alert('Işık Durumu', `Işık ${!isLightOn ? 'açıldı' : 'kapatıldı'}.`)
  };


  // Pompayı açma ve kapama fonksiyonu
  const handlePumpToggle = () => {
    if (client) {
      const pumpMessage = JSON.stringify({ command: isPumpOn ? "0" : "1" }); // 0: kapama, 1: açma
      client.publish('pump/control', pumpMessage);
      setIsPumpOn(!isPumpOn); // Pompa durumunu değiştir

      if (isPumpOn) {
        Alert.alert('Pompa Durumu', 'Pompa başarıyla kapatıldı.');
      } else {
        Alert.alert('Pompa Durumu', 'Pompa başarıyla açıldı.');
      }
    }
  };



  //bitki sulama  -->  plant/commands
  const handleWaterPlant = async (plantId: string) => {
    // if (!isPumpOn) {
    //   Alert.alert('Uyarı', 'Pompa kapalı. Sulama yapamazsınız. İlk önce pompayı açınız!');
    //   return; // Pompa kapalıysa sulama yapılmaz
    // }

    if (wateringInProgress === plantId) {
      Alert.alert('Uyarı', 'Bu bitki zaten sulanıyor.');
      return; // Bitki zaten sulanıyorsa işlem yapılmaz
    }

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
        // JSON formatında mesaj oluştur
        const message = JSON.stringify({ plantId, command: "1" });
        client.publish('plant/commands', message); // Mesaj gönder
        console.log('Sulama komutu gönderildi: ${message}');
      } else {
        console.error('MQTT client is not connected.');
      }

      // Temporarily disable the button for 6 seconds
      setDisabledWateringButtons((prev) => [...prev, plantId]);
      setTimeout(() => {
        setDisabledWateringButtons((prev) => prev.filter((id) => id !== plantId));
      }, 6000);

      setWateringInProgress(plantId); // Sulama başladı

      Alert.alert('Sulama Yapıldı', 'Bitki başarıyla sulandı.');
    }
  };

  // Sulama durdurma fonksiyonu
  const stopWatering = (plantId: string) => {
    if (wateringInProgress !== plantId) {
      Alert.alert('Uyarı', 'Bu bitki zaten sulanmış değil.');
      return; // Sulama yapılmamışsa işlem yapılmaz
    }
    if (client) {
      // Sulama durdurma komutunu gönder: "0" röleyi pasif hale getirir
      const message = JSON.stringify({ plantId, command: "0" });
      client.publish('plant/commands', message);
      console.log(`Sulama durdurma komutu gönderildi: ${message}`);
      Alert.alert('Sulama Durduruldu', 'Sulama işlemi durduruldu.');
    } else {
      console.error('MQTT client is not connected.');
    }
    setWateringInProgress(null); // Sulama işlemini bitir
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







  const renderPlant = ({ item }: { item: Plant }) => {
    const isLowMoisture = lowMoisturePlants.includes(item.id); // Düşük nem seviyesindeki bitki kontrolü
    const animatedStyle = isLowMoisture
      ? {
        opacity: moistureAnim, // Yanıp sönme efekti
        color: 'red', // Kırmızı renk
      }
      : {};

    return (
      <View style={styles.plantContainer}>
        {/* Bitki ID'sini sol üstte göstermek için Text */}
        <Text style={styles.plantId}>{item.id}</Text>
        <TouchableOpacity
          style={styles.plantWrapper}
          onPress={() => navigation.navigate('PlantDetails', { plant: item })}
        >
          <Image source={item.image} style={styles.plantImage} />
          <Text style={styles.plantName}>{item.name}</Text>
        </TouchableOpacity>

        {/* Sulama Durdur Butonu */}
        <TouchableOpacity
          style={styles.stopWateringButton} // Yeni buton stili
          onPress={() => stopWatering(item.id)}
        >
          {/* Su ikonu ve üstünde çapraz çizgi */}
          <View style={styles.iconWrapper}>
            <Icon name="water-outline" size={24} color="#1e90ff" />
            <View style={styles.crossLine} />
          </View>
        </TouchableOpacity>

        {/* Sulama Butonu */}
        <TouchableOpacity
          style={styles.wateringButton}
          onPress={() => handleWaterPlant(item.id)}
          disabled={disabledWateringButtons.includes(item.id)} // Disable for 6 seconds
        >
          <Icon
            name={wateringInProgress === item.id ? 'checkmark-circle-outline' : 'water-outline'}
            size={20}
            color={wateringInProgress === item.id ? 'green' : '#1e90ff'}
          />
        </TouchableOpacity>
        {/* Nem Oranı Gösterimi */}
        <View style={styles.moistureContainer}>
          <Animated.Text style={[styles.moistureText, animatedStyle]}>
            {item.humidity !== undefined ? `${item.humidity}%` : '-'} {/* Eğer nem oranı yoksa çizgi göster */}
          </Animated.Text>
        </View>
      </View>
    );
  };





  return (
    <View style={styles.container}>
      {/* Su Tankı Barı */}
      <WaterTank tankLevel={tankLevel} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plants</Text>
        {!isSearchActive ? (
          <TouchableOpacity style={styles.searchIcon} onPress={toggleSearchMode}>
            <Icon name="search" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search plants..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <TouchableOpacity style={styles.backIcon} onPress={toggleSearchMode}>
              <Icon name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}
      </View>


      <TouchableOpacity style={styles.lightToggleButton} onPress={toggleGlobalLight}>
        <Icon
          name={isLightOn ? 'bulb' : 'bulb-outline'}
          size={33}
          color={isLightOn ? 'yellow' : 'white'}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.pumpButton} onPress={handlePumpToggle}>
        <Text style={styles.buttonText}>{isPumpOn ? 'Pompayı Kapat' : 'Pompayı Aç'}</Text>
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
          size={35} // Keep the size
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
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 25, // Search input ile aralık bırak
  },
  searchIcon: {
    position: 'absolute',
    top: 11,
    right: 10,
    padding: 10,
    borderRadius: 40,
    backgroundColor: '#4285F4',
    borderWidth: 1,
    borderColor: '#778899',
  },
  searchInput: {
    flex: 1,
    height: 35,
    borderColor: '#4285F4',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backIcon: {
    marginRight: 0,
    marginLeft: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    alignItems: 'center', // Center items horizontally
    justifyContent: 'center', // Center items vertically if needed
    flexGrow: 1, // Ensures the list takes up remaining space
  },
  plantId: {
    position: 'absolute',
    top: 5, // Yüksekliği ayarlamak için
    left: 5, // Sol taraftan uzaklık
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Arka plan rengini koyu yapalım
    color: 'white', // Yazı rengi beyaz
    fontSize: 14, // Yazı boyutunu ayarladık
    padding: 5, // Kenar boşlukları
    borderRadius: 5, // Köşe yuvarlama
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    position: 'relative', // Allows positioning for the watering button
    padding: 15, // Adds space around the plant
    borderWidth: 0, // Optional border for visual distinction
    borderColor: '#E8E8E8', // Light border color
    borderRadius: 100, // Makes the container circular or oval
  },
  plantWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantImage: {
    width: 160,
    height: 160,
    borderRadius: 100,
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
  stopWateringButton: {
    position: 'absolute',
    top: 155, // Butonu üst sol köşeye yerleştiriyoruz
    left: 190,
    transform: [{ translateX: -35 }, { translateY: -12 }], // Moves slightly outside the border
    backgroundColor: '#fff',
    width: 35,
    height: 35,
    borderRadius: 50,
    padding: 5,
    zIndex: 1, // Sulama butonunun önünde olmasını sağlar
  },
  iconWrapper: {
    position: 'relative', // Su ikonunun üstüne çizgi yerleştirilecek
    justifyContent: 'center', // Yatayda ortalama
    alignItems: 'center', // Dikeyde ortalama
  },
  crossLine: {
    position: 'absolute',
    top: 12, // İkonun ortasına yerleştiriyoruz
    left: -3,
    width: 30, // Çizgi uzunluğu
    height: 2, // Çizgi kalınlığı
    backgroundColor: 'red', // Çizgi kırmızı
    transform: [{ rotate: '45deg' }], // Çizgiyi çapraz yapmak için döndürüyoruz
    borderRadius: 2, // Yuvarlak hatları için
  },
  wateringButton: {
    position: 'absolute',
    top: 10, // Aligns to the top of the circular border
    left: 180,
    transform: [{ translateX: -35 }, { translateY: -12 }], // Moves slightly outside the border
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  moistureContainer: {
    position: 'absolute',
    top: 35, // Sulama butonunun altına yerleştirme
    left: 205, // Sulama butonuyla hizalama
    transform: [{ translateX: -35 }], // Merkezi hizalama
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 42,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    zIndex: 1,
  },
  moistureText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e90ff', // Nem oranı için dikkat çeken bir renk
  },
  pumpButton: {
    backgroundColor: '#008b8b',
    top: 15,
    width: 160,
    height: 40,
    paddingVertical: 8, // Dikeyde daha küçük padding
    paddingHorizontal: 16, // Yatayda daha küçük padding
    borderRadius: 40, // Yuvarlatılmış köşeler
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center', // Merkezi hizalama
  },
  buttonText: {
    color: '#fff',
    fontSize: 20, // Buton metnini daha küçük yapıyoruz
    fontWeight: 'bold',
  },

});