import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API, Storage } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MobileLoader from '../components/MobileLoader';
import MobilePearlButton from '../components/MobilePearlButton';

export default function LoginScreen({ navigation, onLoginSuccess }: any) {
  const [email, setEmail] = useState('demo@garagesaas.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.login(email.trim(), password.trim());
      if (res.user) {
        await Storage.setUser(res.user);
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Login Failed', res.error || 'Invalid credentials');
      }
    } catch {
      Alert.alert('Connection Error', 'Could not reach server. Verify network.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'two_wheeler' | 'four_wheeler') => {
    if (type === 'two_wheeler') {
      setEmail('demo@garagesaas.com');
      setPassword('password123');
    } else {
      setEmail('test@garagesaas.com');
      setPassword('password123');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="shield-car" size={38} color={COLORS.primary} />
        </View>
        <Text style={styles.brandTitle}>MechBillerAI</Text>
        <Text style={styles.brandSubtitle}>
          Automotive SaaS · Powered by Hybrid StudioZ
        </Text>
      </View>

      {/* Login Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Garage Sign In</Text>
        <Text style={styles.cardSubtitle}>
          Synced with your WebApp cloud account
        </Text>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="garage@example.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ marginVertical: 14 }}>
            <MobileLoader text="Authenticating" />
          </View>
        ) : (
          <MobilePearlButton
            variant="gold"
            onPress={handleLogin}
            style={{ marginTop: 20 }}
          >
            <MaterialCommunityIcons name="login" size={18} color={COLORS.background} style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>Sign In to Workshop</Text>
          </MobilePearlButton>
        )}

        {/* Quick Demo Logins */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>QUICK DEMO ACCOUNTS</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleFillDemo('two_wheeler')}
            >
              <MaterialCommunityIcons name="motorbike" size={16} color={COLORS.primary} />
              <Text style={styles.demoPillText}>Two-Wheeler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoPill}
              onPress={() => handleFillDemo('four_wheeler')}
            >
              <MaterialCommunityIcons name="car" size={16} color={COLORS.primary} />
              <Text style={styles.demoPillText}>Four-Wheeler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 76, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 10,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    marginLeft: 8,
  },
  btnText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  demoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  demoPillText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
