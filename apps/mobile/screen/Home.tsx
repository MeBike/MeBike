
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { HomeScreenNavigationProp } from '../types/navigation';
import { BikeColors } from '../constants/BikeColors';
import { IconSymbol } from '../components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const navigateToIntro = () => {
    navigation.navigate('Intro');
  };

  const features = [
    {
      icon: 'bicycle',
      title: 'Thuê xe đạp dễ dàng',
      description: 'Tìm và thuê xe đạp tại các trạm metro gần bạn',
      color: BikeColors.primary,
    },
    {
      icon: 'qrcode.viewfinder',
      title: 'Quét QR để mở khóa',
      description: 'Mở khóa xe đạp chỉ bằng một lần quét mã QR',
      color: BikeColors.secondary,
    },
    {
      icon: 'map',
      title: 'Theo dõi thời gian thực',
      description: 'Xem vị trí và tình trạng xe đạp trực tiếp',
      color: BikeColors.accent,
    },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BikeColors.primary} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Navigation */}
        <LinearGradient
          colors={[BikeColors.primary, BikeColors.secondary]}
          style={styles.header}
        >
          <View style={styles.navigationBar}>
            <View style={styles.logo}>
              <IconSymbol name="bicycle" size={32} color="white" />
              <Text style={styles.logoText}>BikeShare</Text>
            </View>
            
            <View style={styles.navButtons}>
              <Pressable style={styles.navButton} onPress={navigateToIntro}>
                <Text style={styles.navButtonText}>Giới thiệu</Text>
              </Pressable>
              <Pressable style={styles.loginButton} onPress={navigateToLogin}>
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              </Pressable>
            </View>
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Khám phá thành phố{'\n'}với BikeShare
            </Text>
            <Text style={styles.heroSubtitle}>
              Giải pháp di chuyển thông minh và thân thiện với môi trường
            </Text>
            
            <View style={styles.heroButtons}>
              <Pressable style={styles.primaryButton} onPress={navigateToLogin}>
                <Text style={styles.primaryButtonText}>Bắt đầu ngay</Text>
                <IconSymbol name="arrow.right" size={20} color="white" />
              </Pressable>
              
              <Pressable style={styles.secondaryButton} onPress={navigateToIntro}>
                <Text style={styles.secondaryButtonText}>Tìm hiểu thêm</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Tại sao chọn BikeShare?</Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <LinearGradient
                colors={[feature.color + '20', feature.color + '10']}
                style={styles.featureIcon}
              >
                <IconSymbol
                  name={feature.icon as any}
                  size={32}
                  color={feature.color}
                />
              </LinearGradient>
              
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Thống kê hệ thống</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Trạm metro</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Xe đạp</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Người dùng</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Hoạt động</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[BikeColors.primary + '20', BikeColors.secondary + '20']}
            style={styles.ctaCard}
          >
            <IconSymbol name="bicycle" size={48} color={BikeColors.primary} />
            <Text style={styles.ctaTitle}>Sẵn sàng bắt đầu?</Text>
            <Text style={styles.ctaDescription}>
              Tham gia cộng đồng BikeShare và khám phá cách di chuyển mới
            </Text>
            
            <Pressable style={styles.ctaButton} onPress={navigateToLogin}>
              <Text style={styles.ctaButtonText}>Đăng ký ngay</Text>
              <IconSymbol name="arrow.right" size={18} color="white" />
            </Pressable>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 BikeShare. Tất cả quyền được bảo lưu.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 40,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  primaryButtonText: {
    color: BikeColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BikeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BikeColors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: BikeColors.textSecondary,
    lineHeight: 20,
  },
  statsSection: {
    padding: 20,
    backgroundColor: BikeColors.lightGray + '40',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BikeColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: BikeColors.textSecondary,
    textAlign: 'center',
  },
  ctaSection: {
    padding: 20,
  },
  ctaCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BikeColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 16,
    color: BikeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: BikeColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BikeColors.divider,
  },
  footerText: {
    fontSize: 12,
    color: BikeColors.textSecondary,
  },
});
