import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { IntroScreenNavigationProp } from '../types/navigation';
import { BikeColors } from '../constants/BikeColors';
import { IconSymbol } from '../components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
// import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const introSlides = [
  {
    id: 1,
    title: 'Chào mừng đến với BikeShare',
    description: 'Thuê xe đạp dễ dàng tại các trạm metro. Di chuyển nhanh chóng và thân thiện với môi trường.',
    icon: 'bicycle',
    color: BikeColors.primary,
  },
  {
    id: 2,
    title: 'Quét mã QR để mở khóa',
    description: 'Chỉ cần quét mã QR trên xe để mở khóa và bắt đầu hành trình của bạn.',
    icon: 'qrcode.viewfinder',
    color: BikeColors.secondary,
  },
  {
    id: 3,
    title: 'Theo dõi xe đạp thời gian thực',
    description: 'Xem vị trí xe đạp có sẵn tại các trạm metro và tình trạng pin của từng xe.',
    icon: 'map',
    color: BikeColors.accent,
  },
];

export default function IntroScreen() {
  const navigation = useNavigation<IntroScreenNavigationProp>();
  const [currentSlide, setCurrentSlide] = useState(0);
  // const { markIntroAsSeen } = useAuth();

  const nextSlide = async () => {
    if (currentSlide < introSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // await markIntroAsSeen();
      navigation.navigate('Login');
    }
  };

  const skipIntro = async () => {
    // await markIntroAsSeen();
    navigation.navigate('Login');
  };

  const goBack = () => {
    navigation.goBack();
  };

  const renderSlide = (slide: typeof introSlides[0], index: number) => (
    <View key={slide.id} style={styles.slide}>
      <LinearGradient
        colors={[slide.color + '20', slide.color + '10']}
        style={styles.iconContainer}
      >
        <IconSymbol
          name={slide.icon as any}
          size={80}
          color={slide.color}
        />
      </LinearGradient>
      
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.description}>{slide.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {introSlides.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentSlide ? BikeColors.primary : BikeColors.lightGray,
              width: index === currentSlide ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button and skip */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack}>
          <IconSymbol name="arrow.left" size={24} color={BikeColors.textPrimary} />
        </Pressable>
        
        <Pressable style={styles.skipButton} onPress={skipIntro}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slideIndex);
        }}
        style={styles.scrollView}
      >
        {introSlides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {renderDots()}

      <View style={styles.buttonContainer}>
        <Pressable style={styles.nextButton} onPress={nextSlide}>
          <Text style={styles.nextButtonText}>
            {currentSlide === introSlides.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
          </Text>
          <IconSymbol
            name="arrow.right"
            size={20}
            color="white"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: BikeColors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BikeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: BikeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  nextButton: {
    backgroundColor: BikeColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});