import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from "react-native";
import { API_URL } from "@env";

export default function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

// ----------------------------
// Send the url to the server to scrape the profile
// ----------------------------

  const handleScrape = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Error desconocido");
      }
    } catch (err) {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

// ----------------------------
// Return the result of the scraping
// ----------------------------

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scraper de LinkedIn (Demo)</Text>

      <TextInput
        style={styles.input}
        placeholder="Ingresa la URL de LinkedIn..."
        value={url}
        onChangeText={setUrl}
      />

      <Button title="Obtener información" onPress={handleScrape} />

      {loading && <Text style={styles.loading}>Cargando...</Text>}

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {JSON.stringify(result, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ----------------------------
// Styles
// ----------------------------

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  loading: {
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
  },
  error: {
    marginTop: 15,
    color: "red",
    textAlign: "center",
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
