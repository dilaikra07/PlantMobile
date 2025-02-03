import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlantDetailsProps, EditPlantProps, RootStackParamList } from './types';
import Slider from '@react-native-community/slider';
import LightRequirementCircle from './LightRequirementCircle';



type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditPlant'>;
type EditPlantRouteProp = RouteProp<RootStackParamList, 'EditPlant'>;

interface Plant {
    id: string;
    name: string;
    image: any;
    backgroundColor: string;
    backgroundImage: any;
    watering: string;
    lightRequirement: string;
    description: string;
    addedAt: string;
}

const wateringLevels = ['Very low', 'Low', 'Medium', 'High', 'Very high'];
const backgroundColors = [
    '#E8E8E8', // Light Gray
    '#FFF8DC', // Cornsilk
    '#FFE4E1', // Misty Rose
    '#D3D3D3', // Light Gray
    '#ADD8E6', // Light Blue
    '#F0E68C', // Khaki
    '#FAFAD2', // Light Goldenrod Yellow
    '#FFD700', // Gold
    '#FFB6C1', // Light Pink
    '#98FB98', // Pale Green
    '#AFEEEE', // Pale Turquoise
    '#DB7093', // Pale Violet Red
    '#FFDAB9', // Peach Puff
    '#CD5C5C', // Indian Red
    '#FFA07A', // Light Salmon
    '#7FFFD4', // Aquamarine
    '#40E0D0', // Turquoise
    '#6495ED', // Cornflower Blue
    '#B0C4DE', // Light Steel Blue
    '#E6E6FA', // Lavender
    '#F5DEB3', // Wheat
    '#FFFACD', // Lemon Chiffon
    '#FFEFD5', // Papaya Whip
    '#B0E0E6', // Powder Blue
    '#778899', // Light Slate Gray
    '#708090', // Slate Gray
    '#4682B4', // Steel Blue
];


const EditPlantScreen: React.FC<EditPlantProps> = ({ navigation, route }) => {
    const { plant } = route.params;
    const [plantId, setPlantId] = useState(plant.id); // ID'yi düzenlemek için state ekliyoruz
    const [watering, setWatering] = useState<number>(0); // Türü number olarak değiştirin
    const [name, setName] = useState(plant.name);
    const [lightRequirement, setLightRequirement] = useState(plant.lightRequirement);
    const [description, setDescription] = useState(plant.description);
    const [selectedColor, setSelectedColor] = useState(plant.backgroundColor);

    useEffect(() => {
        setWatering(parseInt(plant.watering.replace('%', ''), 10)); // % işaretini kaldır ve sayıya dönüştür
    }, [plant.watering]);

    const handleSliderChange = (value: number) => {
        setWatering(value); // Slider değeri bir sayı olarak ayarlanır
    };

    const handleSave = async () => {
        if (!name || !watering || !lightRequirement || !plantId) {
            Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun!');
            return;
        }

        try {
            const storedPlants = await AsyncStorage.getItem('plants');
            const plants: Plant[] = storedPlants ? JSON.parse(storedPlants) : [];

            // Mevcut ID ile çakışma kontrolü
            const isIdTaken = plants.some((p) => p.id === plantId && p.id !== plant.id);
            if (isIdTaken) {
                Alert.alert('Hata', 'Bu ID başka bir bitki tarafından kullanılıyor.');
                return;
            }

            const updatedPlant: Plant = {
                ...plant,
                id: plantId, // Yeni ID kaydediliyor
                name,
                watering: `${watering}%`,
                lightRequirement,
                description,
                backgroundColor: selectedColor,
            };

            const updatedPlants = plants.map((p) =>
                p.id === plant.id ? updatedPlant : p
            );

            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            Alert.alert('Başarılı', `${name} başarıyla güncellendi!`);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Hata', 'Bitki güncellenemedi. Lütfen tekrar deneyin.');
            console.error('Error updating plant:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.container}>
                <Text style={styles.header}>Edit Plant</Text>

                {/* Plant ID */}
                <Text style={styles.label}>Plant ID</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Plant ID"
                    value={plantId}
                    onChangeText={setPlantId}
                    keyboardType="numeric" // ID'nin sayısal olması için
                />

                {/* Plant Name */}
                <Text style={styles.label}>Plant Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Plant name"
                    value={name}
                    onChangeText={setName}
                />

                {/* Watering Requirement */}
                <Text style={styles.label}>Watering Requirement</Text>
                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={10}
                        value={watering}
                        onValueChange={handleSliderChange}
                        minimumTrackTintColor="#4CAF50"
                        maximumTrackTintColor="#E8E8E8"
                        thumbTintColor="#4CAF50"
                    />
                    <View style={styles.ticksContainer}>
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((level) => (
                            <Text
                                key={level}
                                style={[
                                    styles.tickLabel,
                                    watering === level && styles.selectedTick, // Seçili seviyeyi işaretleme
                                ]}
                            >
                                {`${level}%`}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* Light Requirement */}
                <View>
                    <Text style={styles.label}>Light Requirement</Text>
                    <LightRequirementCircle lightRequirement={parseInt(lightRequirement.replace('%', ''), 10)} />
                </View>


                {/* Description */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                {/* Background Color Selection */}
                <Text style={styles.label}>Background Color</Text>
                <ScrollView horizontal style={styles.colorScrollView}>
                    <View style={styles.colorContainer}>
                        {backgroundColors.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.selectedColor,
                                ]}
                                onPress={() => setSelectedColor(color)}
                            />
                        ))}
                    </View>
                </ScrollView>


                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    descriptionInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    sliderContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    slider: {
        width: '90%',
    },
    ticksContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
        marginTop: 8,
    },
    tickLabel: {
        fontSize: 12,
        color: '#555',
    },
    selectedTick: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    colorContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorScrollView: {
        marginBottom: 16,
    },
    selectedColor: {
        borderColor: '#000',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        marginRight: 8,
        backgroundColor: '#E8E8E8',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default EditPlantScreen;
