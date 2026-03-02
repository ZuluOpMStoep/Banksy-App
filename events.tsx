import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuth, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      setError('');
      await signInWithOAuth(provider);
      router.replace('/(tabs)');
    } catch (err) {
      setError(`${provider} login failed. Please try again.`);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo Section */}
          <View className="items-center mb-8">
            <Text className="text-4xl font-bold text-foreground mb-2">Banksy</Text>
            <Text className="text-sm text-muted">Professional Trading Analysis</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-error">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="your@email.com"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
            <View className="flex-row items-center border border-border rounded-lg bg-surface overflow-hidden">
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="••••••••"
                placeholderTextColor="#9BA1A6"
                value={password}
                onChangeText={setPassword}
                editable={!isLoading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4 py-3"
                disabled={isLoading}
              >
                <Text className="text-sm font-semibold text-primary">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary rounded-lg py-3 items-center mb-6"
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-bold text-background">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="px-3 text-xs text-muted">OR</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* OAuth Buttons */}
          <View className="gap-3 mb-6">
            <TouchableOpacity
              onPress={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="border border-border rounded-lg py-3 items-center flex-row justify-center gap-2"
            >
              <Text className="text-base font-semibold text-foreground">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOAuthLogin('apple')}
              disabled={isLoading}
              className="border border-border rounded-lg py-3 items-center flex-row justify-center gap-2"
            >
              <Text className="text-base font-semibold text-foreground">Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-sm text-muted">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')} disabled={isLoading}>
              <Text className="text-sm font-semibold text-primary">Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            disabled={isLoading}
            className="mt-4"
          >
            <Text className="text-sm text-primary text-center font-semibold">Forgot Password?</Text>
          </TouchableOpacity>

          {/* Terms */}
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-xs text-muted text-center leading-relaxed">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
