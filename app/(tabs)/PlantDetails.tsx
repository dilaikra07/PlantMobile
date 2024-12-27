import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { PlantDetailsProps, EditPlantProps, RootStackParamList } from './types';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider'; // Slider bileşenini ekleyin.
import mqtt, { MqttClient } from 'mqtt';





type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlantDetails'>;

type PlantDetailsRouteProp = RouteProp<RootStackParamList, 'PlantDetails'>;

interface Plant {
  id: string;
  name: string;
  image: any;
  backgroundColor: string;
  backgroundImage: any;
  watering: string;
  lightRequirement: string;
  description: string;
  addedAt: string; // Bitkinin eklendiği tarih
}

const wateringLevels = ['Very low', 'Low', 'Medium', 'High', 'Very high']; // Slider için seviyeler.



const PlantDetails: React.FC<PlantDetailsProps> = ({ navigation, route }) => {
  const { plant } = route.params;
  const [mqttClient, setMqttClient] = useState<MqttClient | null>(null);
  const [isLightOn, setIsLightOn] = useState(false); // Işığın durumu
  const [isWatered, setIsWatered] = useState(false); // Sulama durumu
  const [isWateringDisabled, setIsWateringDisabled] = useState(false); // Sulama butonu aktifliği
  const [currentPlant, setCurrentPlant] = useState<Plant>({
    ...plant,
    addedAt: plant.addedAt || new Date().toISOString(), // Provide a fallback value
  });



  const [logs, setLogs] = useState<{ icon: string; message: string; timestamp: string }[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUpdatedPlant = async () => {
        try {
          const storedPlants = await AsyncStorage.getItem('plants');
          if (storedPlants) {
            const plants: Plant[] = JSON.parse(storedPlants);
            const updatedPlant = plants.find((p) => p.id === plant.id);
            if (updatedPlant) {
              setCurrentPlant(updatedPlant); // Update the plant data
            }
          }
        } catch (error) {
          console.error('Error fetching updated plant:', error);
        }
      };

      fetchUpdatedPlant();
    }, [plant.id])
  );

  useEffect(() => {
    const loadStates = async () => {
      const storedLight = await AsyncStorage.getItem(`lightState-${plant.id}`);
      const storedWatered = await AsyncStorage.getItem(`wateredState-${plant.id}`);
      const storedLogs = await AsyncStorage.getItem(`logs-${plant.id}`);

      if (storedLight !== null) setIsLightOn(JSON.parse(storedLight));
      if (storedWatered !== null) setIsWatered(JSON.parse(storedWatered));
      if (storedLogs) setLogs(JSON.parse(storedLogs));
    };

    loadStates();
  }, [plant.id]);

  useEffect(() => {
    const client = mqtt.connect('wss://ee264bbda6f847bfbd2b0e24d60d56b9.s1.eu.hivemq.cloud:8884', {
      username: 'mobilApp',
      password: 'mobilApp1',
      protocol: 'wss',
    });

    client.on('connect', () => {
      console.log('MQTT Connected');
    });

    client.on('error', (err) => {
      console.error('MQTT Connection Error:', err);
    });

    setMqttClient(client);

    return () => {
      client.end(); // Bileşen kapandığında bağlantıyı kes
    };
  }, []);

  const saveStatesToStorage = async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const handleWaterPlant = async () => {
    if (isWateringDisabled) return;

    setIsWatered(true); // Set watered state to true
    setIsWateringDisabled(true); // Disable the button

    

    const timestamp = new Date().toLocaleString();
    const newLog = { icon: 'water-outline', message: 'Sulama yapıldı', timestamp };
    const updatedLogs = [newLog, ...logs.slice(0, 4)];

    setLogs(updatedLogs);
    await saveStatesToStorage(`wateredState-${plant.id}`, true);
    await saveStatesToStorage(`logs-${plant.id}`, updatedLogs);

    Alert.alert('Bitki Sulandı', `${plant.name} başarıyla sulandı!`);

    sendWateringMessage(); // Sulama mesajını gönder

    // Schedule the button to reactivate after 1 minute
    setTimeout(async () => {
      setIsWatered(false); // Reset watered state
      setIsWateringDisabled(false); // Reactivate the button
      await saveStatesToStorage(`wateredState-${plant.id}`, false); // Persist the reset state

      // Force a re-render by updating the state
      setIsWatered(false); // Ensure the icon updates to the default state
      console.log('Watering button reactivated');
    }, 6000); // 1 minute
  };

  const handleWateringChange = async (value: number) => {
    const updatedWatering = wateringLevels[value];
    setCurrentPlant((prev) => ({ ...prev, watering: updatedWatering }));

    const storedPlants = await AsyncStorage.getItem('plants');
    if (storedPlants) {
      const plants: Plant[] = JSON.parse(storedPlants);
      const updatedPlants = plants.map((p) =>
        p.id === currentPlant.id ? { ...p, watering: updatedWatering } : p
      );
      await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
    }
  };

  const sendWateringMessage = () => {
    if (mqttClient) {
      mqttClient.publish('plant/watering', `Sulama yapıldı: ${plant.name}`);
      console.log(`Sulama mesajı gönderildi: ${plant.name}`);
    } else {
      console.error('MQTT istemcisi bağlı değil');
    }
  };



  const toggleLight = async () => {
    const newState = !isLightOn; // Toggle the light state
    setIsLightOn(newState); // Update state

    

    const timestamp = new Date().toLocaleString();
    const newLog = {
      icon: newState ? 'bulb' : 'bulb-outline',
      message: `Işık ${newState ? 'açıldı' : 'kapatıldı'}`,
      timestamp,
    };

    const updatedLogs = [newLog, ...logs.slice(0, 4)];
    setLogs(updatedLogs);

    // Save the updated light state and logs to AsyncStorage
    await saveStatesToStorage(`lightState-${plant.id}`, newState);
    await saveStatesToStorage(`logs-${plant.id}`, updatedLogs);

    // Inform the user about the light state
    Alert.alert('Işık Durumu', `${plant.name} için ışık ${newState ? 'açıldı' : 'kapatıldı'}.`);
    
    sendLightMessage(newState); // Işık mesajını gönder
  };

  const sendLightMessage = (newState: boolean) => {
    if (mqttClient && mqttClient.connected) {
      const message = newState ? "Light On" : "Light Off";
      mqttClient.publish('plant/light', message, { qos: 1 }, (err) => {
        if (err) {
          console.error("MQTT Publish Error:", err);
        } else {
          console.log("Message sent:", message);
        }
      });
    } else {
      console.error("MQTT Client is not connected.");
    }
  };

  const deletePlant = async () => {
    try {
      const storedPlants = await AsyncStorage.getItem('plants');
      if (storedPlants) {
        const plants = JSON.parse(storedPlants) as Plant[];
        console.log('Stored Plants Before Delete:', plants);

        const updatedPlants = plants.filter((p) => p.id !== plant.id);
        console.log('Updated Plants After Delete:', updatedPlants);

        await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
        console.log('Plants saved successfully.');

        navigation.goBack();
      } else {
        console.log('No plants found in storage.');
      }
    } catch (error) {
      console.error('Error deleting plant:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={[styles.header, { backgroundColor: currentPlant.backgroundColor }]}>
        <Image source={currentPlant.backgroundImage} style={styles.image} />
        <Text style={styles.name}>{currentPlant.name}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.label}>Sulama Seviyesi:</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={4}
            step={1}
            value={wateringLevels.indexOf(currentPlant.watering)}
            onValueChange={handleWateringChange}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#E8E8E8"
            thumbTintColor="#4CAF50"
            disabled // Slider'ın düzenlenmesini engeller
          />
          <View style={styles.ticksContainer}>
            {wateringLevels.map((level, index) => (
              <View key={index} style={styles.tickWrapper}>
                <View
                  style={[
                    styles.tick,
                    wateringLevels.indexOf(currentPlant.watering) === index && styles.selectedTick,
                  ]}
                />
                <Text style={styles.tickLabel}>{level}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.label}>Işık Gereksinimi:</Text>
        <Text style={styles.value}>{currentPlant.lightRequirement}</Text>

        <Text style={styles.label}>Açıklama:</Text>
        <Text style={styles.value}>{currentPlant.description || 'Açıklama eklenmedi.'}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={deletePlant}>
          <Text style={styles.actionText}>Delete Plant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditPlant', { plant })}
        >
          <Text style={styles.actionText}>Edit Plant Details</Text>
        </TouchableOpacity>

      </View>

      {/* Butonlar */}
      <View style={styles.buttonContainer}>
        {/* Sulama Butonu */}
        <TouchableOpacity
          style={[
            styles.button,
            isWateringDisabled && styles.disabledButton, // Buton devre dışı görünüm
          ]}
          onPress={handleWaterPlant}
          disabled={isWateringDisabled} // Buton devre dışı
        >
          <Icon
            name={isWatered ? 'checkmark-circle-outline' : 'water-outline'} // Sulama durumu simgesi
            size={24}
            color={isWatered ? 'green' : 'blue'}
          />
          <Text style={styles.buttonText}>
            {isWatered ? 'Sulandı' : 'Sulama'}
          </Text>
        </TouchableOpacity>

        {/* Işık Butonu */}
        <TouchableOpacity style={styles.button} onPress={toggleLight}>
          <Icon
            name={isLightOn ? 'bulb' : 'bulb-outline'}
            size={24}
            color={isLightOn ? 'yellow' : 'gray'}
          />
          <Text style={styles.buttonText}>{isLightOn ? 'Işığı Kapat' : 'Işığı Aç'}</Text>
        </TouchableOpacity>
      </View>

      {/* Loglar */}
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Loglar</Text>
        <FlatList
          data={logs}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.logItem}>
              <Icon name={item.icon} size={20} color="#555" style={styles.logIcon} />
              <View>
                <Text style={styles.logMessage}>{item.message}</Text>
                <Text style={styles.logTimestamp}>{item.timestamp}</Text>
              </View>
            </View>
          )}
        />
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  slider: {
    width: '90%',
    height: 40,
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 8,
  },
  tickWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  tick: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E8E8',
  },
  selectedTick: {
    backgroundColor: '#4CAF50',
  },
  tickLabel: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    color: '#555',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  value: {
    fontSize: 16,
    color: '#555',
  },
  detailContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 16,
  },
  logContainer: {
    marginBottom: 16,
  },
  actionsContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    marginTop: 16,
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: '#f3f3f3',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#000',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    width: 120,
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logIcon: {
    marginRight: 8,
  },
  logMessage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 14,
    color: '#666',
  },
});

export default PlantDetails;
