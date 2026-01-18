import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";

const ProfileScreen = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user.full_name || "");
  const [phone, setPhone] = useState(user.phone_number || "");
  const [email, setEmail] = useState(user.email || "");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* ------------------ Validation ------------------ */
  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePhone = (value: string) =>
    /^[6-9]\d{9}$/.test(value);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your full name");
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert("Validation Error", "Enter a valid 10-digit mobile number");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Validation Error", "Enter a valid email address");
      return;
    }

    Alert.alert("Success", "Profile updated successfully");
    // 🔗 Call API here
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ---------- Avatar Section ---------- */}
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: "https://i.pravatar.cc/150?img=12",
          }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.cameraBtn}>
          <Ionicons name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ---------- Profile Card ---------- */}
      <View style={styles.card}>
        <ProfileInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        <ProfileInput
          label="Mobile Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          rightText="Verify"
        />

        <ProfileInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          rightText="Verify"
        />

        {/* ---------- DOB ---------- */}
        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.input}>
            <Text style={{ color: dob ? "#000" : "#999" }}>
              {dob ? dob.toDateString() : "Select date"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ---------- Gender ---------- */}
        <ProfileInput
          label="Gender (optional)"
          value={gender}
          onChangeText={setGender}
          placeholder="Male / Female / Other"
        />
      </View>

      {/* ---------- Save Button ---------- */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>

      {/* ---------- Date Picker ---------- */}
      {showDatePicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setDob(date);
          }}
        />
      )}
    </ScrollView>
  );
};

/* ------------------ Reusable Input ------------------ */
const ProfileInput = ({
  label,
  rightText,
  ...props
}: any) => (
  <View style={styles.inputWrapper}>
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {rightText && <Text style={styles.verify}>{rightText}</Text>}
    </View>
    <TextInput style={styles.input} {...props} />
  </View>
);

export default ProfileScreen;

/* ------------------ Styles ------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF7F5",
    paddingHorizontal: 16,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 4,
    right: 130 / 2 - 8,
    backgroundColor: "#2FA4A9",
    padding: 8,
    borderRadius: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F6F8FA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  verify: {
    color: "#2FA4A9",
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: "#2FA4A9",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginVertical: 24,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
