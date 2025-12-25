import { router } from "expo-router";
import { X } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Modal() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Modal</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <X color="#000000" size={24} />
        </TouchableOpacity>
      </View>
      <Text style={styles.text}>This is a modal screen!</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  text: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#00A3A3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});