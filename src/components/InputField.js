// src/components/InputField.js
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

const InputField = ({
  label,
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
}) => {
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
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          editable={editable}
        />
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
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  icon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.dark,
  },
});

export default InputField;