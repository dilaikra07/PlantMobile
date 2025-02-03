import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

type RootStackParamList = {
    Home: undefined;
    PlantDetails: { plant: Plant };
    AddPlant: undefined;
    EditPlant: { plant: Plant };
};


type Plant = {
    id: string;
    name: string;
    image: any;
    backgroundColor: string;
    backgroundImage: any;
    watering: string;
    lightRequirement: string;
    description: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddPlant'>;
type RoutePropType = RouteProp<RootStackParamList, 'AddPlant'>;

interface Props {
    navigation: NavigationProp;
    route: RoutePropType;
}

const predefinedPlants = [
    {
        name: 'Monstera',
        image: require('@/assets/images/monstera.png'),
        watering: '60%', // Medium
        lightRequirement: 'Bright indirect light',
        description: 'Monstera is a tropical plant known for its unique leaf patterns.',
    },
    {
        name: 'Snake Plant',
        image: require('@/assets/images/snakeplant.png'),
        watering: '30%', // Low
        lightRequirement: 'Low to bright indirect light',
        description: 'Snake Plant is a hardy plant that thrives in almost any condition.',
    },
    {
        name: 'Peace Lily',
        image: require('@/assets/images/peacelily.png'),
        watering: '70%', // Medium
        lightRequirement: 'Low to medium indirect light',
        description: 'Peace Lily is known for its beautiful white flowers and air-purifying qualities.',
    },
    {
        name: 'Aloe Vera',
        image: require('@/assets/images/aloevera.png'),
        watering: '20%', // Very Low
        lightRequirement: 'Bright indirect light',
        description: 'Aloe Vera is a succulent plant known for its medicinal properties.',
    },
    {
        name: 'Cactus',
        image: require('@/assets/images/kaktus.png'),
        watering: '10%', // Very Low
        lightRequirement: 'Full sunlight',
        description: 'Cactus is a resilient plant that thrives in dry, arid environments.',
    },
    {
        name: 'Orchid',
        image: require('@/assets/images/orkid.png'),
        watering: '60%', // Medium
        lightRequirement: 'Bright indirect light',
        description: 'Orchids are elegant plants known for their beautiful and intricate flowers.',
    },
    {
        name: 'Daisy',
        image: require('@/assets/images/papatya.png'),
        watering: '60%',
        lightRequirement: 'Full sunlight',
        description: 'Daisies are cheerful flowers that brighten up any garden or room.',
    },
    {
        name: 'Rose',
        image: require('@/assets/images/rose.png'),
        watering: '60%',
        lightRequirement: 'Full sunlight',
        description: 'Roses are classic flowers symbolizing love and beauty.',
    },
    {
        name: 'Violet',
        image: require('@/assets/images/menekse.png'),
        watering: '60%',
        lightRequirement: 'Low to medium indirect light',
        description: 'Violets are small, delicate plants with striking purple flowers.',
    },
    {
        name: 'Kalanchoe',
        image: require('@/assets/images/kalanchoe.png'),
        watering: '30%',
        lightRequirement: 'Bright indirect light',
        description: 'Kalanchoe is a succulent known for its vibrant and long-lasting flowers.',
    },
    {
        name: 'Begonia',
        image: require('@/assets/images/begonya.png'),
        watering: '60%',
        lightRequirement: 'Low to medium indirect light',
        description: 'Begonias are versatile plants prized for their colorful foliage and flowers.',
    },
    {
        name: 'Nergis',
        image: require('@/assets/images/nergis.png'),
        watering: '60%',
        lightRequirement: 'Low to medium indirect light',
        description: 'Bengisunun çiçeği',
    },
];


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

const wateringLevels = [0, 25, 50, 75, 100];

const AddPlantScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [watering, setWatering] = useState<number>(0); // Türü number olarak değiştirin
    const [lightRequirement, setLightRequirement] = useState('');
    const [description, setDescription] = useState('');
    const [selectedColor, setSelectedColor] = useState(backgroundColors[0]);
    const [selectedImage, setSelectedImage] = useState<any>(null);

    const handleSliderChange = (value: number) => {
        setWatering(value); // Slider değeri bir sayı olarak ayarlanır
    };


    const handleSelectImage = (plant: typeof predefinedPlants[0]) => {
        setSelectedImage(plant.image);
        setName(plant.name); // İsmi otomatik doldur
        setWatering(parseInt(plant.watering.replace('%', ''), 10)); // Sulama seviyesini number olarak güncelle
        setLightRequirement(plant.lightRequirement); // Işık gereksinimi otomatik doldur
        setDescription(plant.description); // Açıklamayı otomatik doldur
    };

    const handleSave = async () => {
        if (!name || !watering || !lightRequirement) {
            Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun!');
            return;
        }

        const newPlant: Plant = {
            id: Date.now().toString(),
            name,
            image: selectedImage, // Görsel kaydediliyor
            backgroundColor: selectedColor, // Arka plan rengi kaydediliyor
            backgroundImage: selectedImage, // Arka plan resmi kaydediliyor
            watering: `${watering}%`,
            lightRequirement,
            description,
        };

        try {
            const storedPlants = await AsyncStorage.getItem('plants');
            const plants = storedPlants ? JSON.parse(storedPlants) : [];
            const updatedPlants = [...plants, newPlant];
            await AsyncStorage.setItem('plants', JSON.stringify(updatedPlants));
            Alert.alert('Başarılı', `${name} başarıyla eklendi!`);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Hata', 'Bitki kaydedilemedi. Lütfen tekrar deneyin.');
            console.error('Error saving plant:', error);
        }
    };



    return (
        <ScrollView style={styles.container}>
            <View style={styles.container}>
                <Text style={styles.header}>Add a plant</Text>

                {/* Plant Name Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Plant name"
                    value={name}
                    onChangeText={setName}
                />

                {/* Watering */}
                <Text style={styles.label}>Watering</Text>
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
                    {/* Ticks and Labels */}
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
                <Text style={styles.label}>Light requirement</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Light requirement"
                    value={lightRequirement}
                    onChangeText={setLightRequirement}
                />

                {/* Description */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Description about the plant"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                {/* Background Color Selection */}
                <Text style={styles.label}>Background color</Text>
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


                {/* Background Image Selection */}
                <Text style={styles.label}>Select a plant</Text>
                <FlatList
                    data={predefinedPlants}
                    horizontal
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.imageOption,
                                selectedImage === item.image && styles.selectedImage,
                            ]}
                            onPress={() => handleSelectImage(item)}
                        >
                            <Image
                                source={item.image?.uri ? item.image : { uri: 'https://example.com/placeholder.png' }}
                                style={styles.image}
                            />
                            <Text style={styles.imageText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton}>
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
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    optionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    optionButton: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    selectedOption: {
        backgroundColor: '#4CAF50',
    },
    optionText: {
        fontSize: 14,
    },
    selectedOptionText: {
        color: '#fff',
    },
    descriptionInput: {
        height: 80,
        textAlignVertical: 'top',
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
    imageOption: {
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        borderRadius: 8,
        overflow: 'hidden',
        alignItems: 'center', // Center the text and image
        justifyContent: 'center', // Center the content
    },

    selectedImage: {
        borderColor: '#000',
    },
    image: {
        width: 80,
        height: 80,
        resizeMode: 'cover',
    },
    imageText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4, // Add some spacing between the image and the text
        color: '#000', // Ensure the text is visible
        fontWeight: 'bold', // Make the text bold for better visibility
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

});

export default AddPlantScreen;
