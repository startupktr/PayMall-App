import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await register(username, email.trim(), password, confirmPassword);

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (err: any) {
      Alert.alert(
        "Registration failed",
        err?.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {/* LOGO */}
            <Image
              source={require("@/../assets/Splash-Icon.png")}
              style={styles.image}
            />

            {/* TITLE */}
            <Text
              style={[
                styles.title,
                { color: isDark ? "#F8FAFC" : "#020617" },
              ]}
            >
              Create Account
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#94A3B8" : "#64748B" },
              ]}
            >
              Join PayMall today
            </Text>

            {/* EMAIL */}
            <TextInput
              placeholder="Email"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#020617" : "#FFFFFF",
                  color: isDark ? "#F8FAFC" : "#020617",
                  borderColor: isDark ? "#1E293B" : "#CBD5E1",
                },
              ]}
            />

            {/* USERNAME */}
            <TextInput
              placeholder="Mobile"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#020617" : "#FFFFFF",
                  color: isDark ? "#F8FAFC" : "#020617",
                  borderColor: isDark ? "#1E293B" : "#CBD5E1",
                },
              ]}
            />

            {/* PASSWORD */}
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: isDark ? "#020617" : "#FFFFFF",
                  borderColor: isDark ? "#1E293B" : "#CBD5E1",
                },
              ]}
            >
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                style={[
                  styles.passwordInput,
                  { color: isDark ? "#F8FAFC" : "#020617" },
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={22}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            {/* CONFIRM PASSWORD */}
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: isDark ? "#020617" : "#FFFFFF",
                  borderColor: isDark ? "#1E293B" : "#CBD5E1",
                },
              ]}
            >
              <TextInput
                ref={confirmRef}
                placeholder="Confirm Password"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                style={[
                  styles.passwordInput,
                  { color: isDark ? "#F8FAFC" : "#020617" },
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? "eye-off" : "eye"}
                  size={22}
                  color={isDark ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            {/* REGISTER BUTTON */}
            <TouchableOpacity style={styles.btn} onPress={handleRegister}>
              <Text style={styles.btnText}>
                {loading ? "Creating account..." : "Register"}
              </Text>
            </TouchableOpacity>

            {/* LOGIN LINK */}
            <View style={styles.registerRow}>
              <Text style={{ color: isDark ? "#CBD5E1" : "#020617" }}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.register}> Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 95, // 🔑 keyboard-safe
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
  },
  btnText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  register: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
