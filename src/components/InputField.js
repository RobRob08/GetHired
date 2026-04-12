// src/components/InputField.js
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import COLORS from "../constants/colors";

const InputField = ({
  label,
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  editable = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.container}>
        {iconName && (
          <MaterialIcons
            name={iconName}
            size={18}
            color={COLORS.mid}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mid}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
            style={styles.visibilityBtn}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={18}
              color={COLORS.mid}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 6,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
  visibilityBtn: {
    padding: 4,
  },
});

export default InputField;
