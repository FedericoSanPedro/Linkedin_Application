import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSend = () => {
    setResult({ userInput: input });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prueba de Input → JSON</Text>

      <TextInput
        style={styles.input}
        placeholder="Escribe algo..."
        value={input}
        onChangeText={setInput}
      />

      <Button title="Enviar" onPress={handleSend} />

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {JSON.stringify(result, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: "#eee",
    padding: 15,
    borderRadius: 10,
  },
  resultText: {
    fontFamily: "monospace",
  },
});
