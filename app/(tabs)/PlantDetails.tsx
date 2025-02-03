import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { PlantDetailsProps, EditPlantProps, RootStackParamList } from './types';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider'; // Slider bileşenini ekleyin.
import { Plant } from './types';
import LightRequirementCircle from './LightRequirementCircle';





type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlantDetails'>;

type PlantDetailsRouteProp = RouteProp<RootStackParamList, 'PlantDetails'>;



const wateringLevels = ['Very low', 'Low', 'Medium', 'High', 'Very high']; // Slider için seviyeler.



const PlantDetails: React.FC<PlantDetailsProps> = ({ navigation, route }) => {
  const { plant } = route.params;
  const [isLightOn, setIsLightOn] = useState(false); // Işığın durumu
  const [isWatered, setIsWatered] = useState(false); // Sulama durumu
  const [isWateringDisabled, setIsWateringDisabled] = useState(false); // Sulama butonu aktifliği
  const [currentPlant, setCurrentPlant] = useState<Plant>({
    ...plant,
    addedAt: plant.addedAt || new Date().toISOString(), // Provide a fallback value
    watering: plant.watering || '0%',
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
              setLogs(updatedPlant.logs || []); // Update logs
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

  const saveStatesToStorage = async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };



  const handleWateringChange = async (value: number) => {
    const updatedWatering = `${wateringLevels[value]}%`;
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
        <Text style={styles.label}>Watering Level: {currentPlant.watering}</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={10}
            value={parseInt(currentPlant.watering.replace('%', ''), 10)} // Mevcut sulama seviyesi
            onValueChange={handleWateringChange}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#E8E8E8"
            thumbTintColor="#4CAF50"
            disabled // Slider'ın düzenlenmesini engeller
          />
          <View style={styles.ticksContainer}>
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((level) => (
              <Text
                key={level}
                style={[
                  styles.tickLabel,
                  parseInt(currentPlant.watering.replace('%', ''), 10) === level && styles.selectedTick, // Seçili seviyeyi işaretleme
                ]}
              >
                {`${level}%`}
              </Text>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.label}>Light Requirement</Text>
          <LightRequirementCircle lightRequirement={parseInt(plant.lightRequirement.replace('%', ''), 10)} />
        </View>


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



      </View>

      {/* Loglar */}
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Loglar</Text>
        {logs.length > 0 ? (
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
        ) : (
          <Text style={styles.noLogs}>Henüz bir işlem yapılmadı.</Text>
        )}
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
    fontWeight: 'bold',
    color: '#4CAF50',
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
    backgroundColor: '#fff'
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
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    elevation: 2,
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
  noLogs: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PlantDetails;
