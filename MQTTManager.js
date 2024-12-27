import React, { useState } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import mqtt from 'mqtt';

const App = () => {
  const [client, setClient] = useState(null);

  // MQTT bağlantısı kur
  const connectToMQTT = () => {
    const mqttClient = mqtt.connect('wss://ee264bbda6f847bfbd2b0e24d60d56b9.s1.eu.hivemq.cloud:8884', {
      username: 'mobilApp',
      password: 'mobilApp1',
      protocol: 'wss', // WebSocket kullanılıyor
    });

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT');
      Alert.alert('Bağlantı', 'MQTT sunucusuna bağlandı.');
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT connection error:', err);
      Alert.alert('Hata', 'MQTT bağlantı hatası.');
    });

    mqttClient.on('message', (topic, message) => {
      console.log(`Received message: ${message.toString()} on topic: ${topic}`);
    });

    setClient(mqttClient);
  };

  // MQTT mesajı gönder
  const sendMessage = () => {
    if (client) {
      client.publish('testTopic', 'Mobil Uygulamadan Mesaj');
      Alert.alert('Başarılı', 'Mesaj gönderildi!');
    } else {
      Alert.alert('Hata', 'MQTT istemcisi bağlı değil.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="MQTT Bağlan" onPress={connectToMQTT} />
      <Button title="Mesaj Gönder" onPress={sendMessage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
