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
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login(email.trim(), password);

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch {
      Alert.alert("Login failed", "Invalid credentials");
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
              source={require("../../assets/Splash-Icon.jpeg")}
              style={styles.image}
            />

            {/* TITLE */}
            <Text
              style={[
                styles.title,
                { color: isDark ? "#F8FAFC" : "#020617" },
              ]}
            >
              Welcome to PayMall
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: isDark ? "#94A3B8" : "#64748B" },
              ]}
            >
              Shop smarter around you
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <TouchableOpacity style={styles.btn} onPress={handleLogin}>
              <Text style={styles.btnText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* REGISTER */}
            <View style={styles.registerRow}>
              <Text style={{ color: isDark ? "#CBD5E1" : "#020617" }}>
                Don’t have an account?
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.register}> Register</Text>
              </TouchableOpacity>
            </View>

            {/* SKIP */}
            <TouchableOpacity onPress={() => navigation.replace("Main")}>
              <Text
                style={[
                  styles.skip,
                  { color: isDark ? "#94A3B8" : "#64748B" },
                ]}
              >
                Skip for now →
              </Text>
            </TouchableOpacity>
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
    paddingBottom: 140, // 🔥 KEY FIX — allows scrolling above keyboard
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
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
  },
  forgot: {
    textAlign: "right",
    color: "#2563EB",
    marginBottom: 20,
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
    marginTop: 16,
  },
  register: {
    color: "#2563EB",
    fontWeight: "600",
  },
  skip: {
    marginTop: 28,
    textAlign: "center",
  },
});
