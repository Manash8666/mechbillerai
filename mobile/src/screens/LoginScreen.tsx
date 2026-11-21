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

type UserRole = 'owner' | 'manager' | 'mechanic';

export default function LoginScreen({ navigation, onLoginSuccess }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email address and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await API.login(email.trim(), password.trim());
      if (res.user) {
        const userWithRole = {
          ...res.user,
          activeRole: selectedRole || res.user.role || 'owner',
        };
        await Storage.setUser(userWithRole);
        if (onLoginSuccess) {
          onLoginSuccess(userWithRole);
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        Alert.alert('Sign In Failed', res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      console.warn('Login network exception:', err);
      Alert.alert(
        'Connection Error',
        'Could not communicate with the MotoBan Production Server (https://app.motoban.in). Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="shield-check" size={38} color={COLORS.primary} />
        </View>
        <Text style={styles.brandTitle}>MotoBan</Text>
        <Text style={styles.brandSubtitle}>
          Automotive Production Engine · Powered by Hybrid StudioZ
        </Text>
      </View>

      {/* Login Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Workshop Sign In</Text>
        <Text style={styles.cardSubtitle}>
          Synced live with your MotoBan cloud account
        </Text>

        {/* Role Selector */}
        <Text style={styles.label}>Select Workshop Role</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[
              styles.roleBtn,
              selectedRole === 'owner' && styles.roleBtnActiveOwner,
            ]}
            onPress={() => setSelectedRole('owner')}
          >
            <MaterialCommunityIcons
              name="crown"
              size={16}
              color={selectedRole === 'owner' ? COLORS.background : COLORS.primary}
            />
            <Text
              style={[
                styles.roleBtnText,
                selectedRole === 'owner' && styles.roleBtnTextActive,
              ]}
            >
              Owner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              selectedRole === 'manager' && styles.roleBtnActiveManager,
            ]}
            onPress={() => setSelectedRole('manager')}
          >
            <MaterialCommunityIcons
              name="account-tie"
              size={16}
              color={selectedRole === 'manager' ? COLORS.background : '#38BDF8'}
            />
            <Text
              style={[
                styles.roleBtnText,
                selectedRole === 'manager' && styles.roleBtnTextActive,
              ]}
            >
              Manager
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              selectedRole === 'mechanic' && styles.roleBtnActiveMechanic,
            ]}
            onPress={() => setSelectedRole('mechanic')}
          >
            <MaterialCommunityIcons
              name="wrench"
              size={16}
              color={selectedRole === 'mechanic' ? COLORS.background : '#FF5E14'}
            />
            <Text
              style={[
                styles.roleBtnText,
                selectedRole === 'mechanic' && styles.roleBtnTextActive,
              ]}
            >
              Technician
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="garage@motoban.in"
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

        {/* Cloud Server Status */}
        <View style={styles.serverInfoBox}>
          <MaterialCommunityIcons name="cloud-check" size={14} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={styles.serverInfoText}>
            Production Engine · https://app.motoban.in/
          </Text>
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
    textAlign: 'center',
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleBtnActiveOwner: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleBtnActiveManager: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  roleBtnActiveMechanic: {
    backgroundColor: '#FF5E14',
    borderColor: '#FF5E14',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  roleBtnTextActive: {
    color: COLORS.background,
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
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 46,
    color: COLORS.text,
    marginLeft: 8,
    fontSize: 14,
  },
  btnText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 15,
  },
  serverInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  serverInfoText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
