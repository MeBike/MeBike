import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { LoginScreenNavigationProp } from '../types/navigation';
import { BikeColors } from '../constants/BikeColors';
import { IconSymbol } from '../components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
// import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const { signInWithEmail, signInWithGoogle, isLoading } = useAuth();
  const isLoading = false; // Temporary until AuthContext is added

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    // await signInWithEmail(email, password);
    // Alert.alert('Success', 'Login functionality will be implemented');
    
    // Sau khi đăng nhập, chuyển sang màn hình chọn trạm
    navigation.navigate('StationSelect');
  };

  const handleGoogleLogin = async () => {
    // await signInWithGoogle();
    Alert.alert('Success', 'Google login functionality will be implemented');
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[BikeColors.primary, BikeColors.secondary]}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={goBack}>
            <IconSymbol name="arrow.left" size={24} color="white" />
          </Pressable>
          
          <View style={styles.headerContent}>
            <IconSymbol name="bicycle" size={48} color="white" />
            <Text style={styles.headerTitle}>Đăng nhập</Text>
            <Text style={styles.headerSubtitle}>Chào mừng bạn trở lại!</Text>
          </View>
        </LinearGradient>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              placeholderTextColor={BikeColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={BikeColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </Pressable>

          <Pressable 
            style={[styles.loginButton, isLoading && styles.disabledButton]} 
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Text>
          </Pressable>

          {/* <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable 
            style={styles.googleButton} 
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <IconSymbol name="globe" size={20} color={BikeColors.textPrimary} />
            <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
          </Pressable> */}

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <Pressable onPress={goToRegister}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: BikeColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: BikeColors.textPrimary,
    backgroundColor: 'white',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: BikeColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BikeColors.divider,
  },
  dividerText: {
    marginHorizontal: 16,
    color: BikeColors.textSecondary,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BikeColors.divider,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  googleButtonText: {
    color: BikeColors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: BikeColors.textSecondary,
    fontSize: 16,
  },
  registerLink: {
    color: BikeColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});