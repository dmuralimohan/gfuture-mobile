import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import GradientButton from '../../components/GradientButton';
import { authService } from '../../services';
import { Colors, Spacing, BorderRadius } from '../../theme';

const STEP = { PHONE: 0, OTP: 1, NEW_PASSWORD: 2, DONE: 3 };

const ForgotPasswordScreen = ({ navigation }) => {
    const [step, setStep] = useState(STEP.PHONE);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const otpRef = useRef(null);
    const passRef = useRef(null);
    const confirmRef = useRef(null);

    const handleSendOTP = async () => {
        const errs = {};
        const clean = phone.replace(/\D/g, '');
        if (!clean || clean.length < 10) errs.phone = 'Enter a valid 10-digit phone number';
        setErrors(errs);
        if (Object.keys(errs).length) return;

        setLoading(true);
        try {
            const { data } = await authService.forgotPassword(clean);
            if (data._dev_otp) {
                Alert.alert('Dev OTP', `Your code: ${data._dev_otp}`);
            }
            Alert.alert('Code Sent', 'A reset code has been sent to your phone.');
            setStep(STEP.OTP);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = () => {
        const errs = {};
        if (!otp || otp.length !== 6) errs.otp = 'Enter the 6-digit code';
        setErrors(errs);
        if (Object.keys(errs).length) return;
        setStep(STEP.NEW_PASSWORD);
    };

    const handleResetPassword = async () => {
        const errs = {};
        if (!newPassword || newPassword.length < 6) errs.newPassword = 'Minimum 6 characters';
        if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        if (Object.keys(errs).length) return;

        setLoading(true);
        try {
            const clean = phone.replace(/\D/g, '');
            await authService.resetPassword(clean, otp, newPassword);
            setStep(STEP.DONE);
            Alert.alert('Success', 'Password reset successfully!', [
                { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            ]);
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={ styles.stepRow }>
            { [0, 1, 2].map((s) => (
                <View
                    key={ s }
                    style={ [styles.stepDot, step >= s && styles.stepDotActive] }
                />
            )) }
        </View>
    );

    return (
        <LinearGradient colors={ ['#dbeafe', '#eff6ff', '#f0f4ff'] } style={ styles.flex }>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <KeyboardAvoidingView
                behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
                style={ styles.flex }
            >
                <ScrollView
                    contentContainerStyle={ styles.scrollContent }
                    showsVerticalScrollIndicator={ false }
                    keyboardShouldPersistTaps="always"
                >
                    {/* Back */ }
                    <Pressable onPress={ () => navigation.goBack() } style={ styles.backBtn }>
                        <Ionicons name="chevron-back" size={ 24 } color={ Colors.textPrimary } />
                    </Pressable>

                    {/* Icon */ }
                    <View style={ styles.iconContainer }>
                        <View style={ styles.iconCircle }>
                            <Ionicons
                                name={ step === STEP.DONE ? 'checkmark-circle' : 'lock-closed' }
                                size={ 48 }
                                color={ step === STEP.DONE ? Colors.success : Colors.primary }
                            />
                        </View>
                    </View>

                    {/* Title */ }
                    <Text style={ styles.title }>
                        { step === STEP.PHONE && 'Forgot Password' }
                        { step === STEP.OTP && 'Verify Code' }
                        { step === STEP.NEW_PASSWORD && 'New Password' }
                        { step === STEP.DONE && 'All Done!' }
                    </Text>
                    <Text style={ styles.subtitle }>
                        { step === STEP.PHONE && 'Enter your registered phone number to receive a reset code.' }
                        { step === STEP.OTP && 'Enter the 6-digit code sent to your phone.' }
                        { step === STEP.NEW_PASSWORD && 'Create a new password for your account.' }
                        { step === STEP.DONE && 'Your password has been reset successfully.' }
                    </Text>

                    { renderStepIndicator() }

                    {/* Step: Phone */ }
                    { step === STEP.PHONE && (
                        <View style={ styles.form }>
                            <InputField
                                label="Phone Number"
                                value={ phone }
                                onChangeText={ setPhone }
                                placeholder="Enter your 10-digit phone"
                                icon="call-outline"
                                keyboardType="phone-pad"
                                maxLength={ 15 }
                                returnKeyType="done"
                                onSubmitEditing={ handleSendOTP }
                                error={ errors.phone }
                            />
                            <GradientButton
                                title="SEND RESET CODE"
                                onPress={ handleSendOTP }
                                loading={ loading }
                                size="large"
                                style={ styles.submitBtn }
                            />
                        </View>
                    ) }

                    {/* Step: OTP */ }
                    { step === STEP.OTP && (
                        <View style={ styles.form }>
                            <InputField
                                label="Verification Code"
                                inputRef={ otpRef }
                                value={ otp }
                                onChangeText={ setOtp }
                                placeholder="Enter 6-digit code"
                                icon="keypad-outline"
                                keyboardType="number-pad"
                                maxLength={ 6 }
                                returnKeyType="done"
                                onSubmitEditing={ handleVerifyOTP }
                                error={ errors.otp }
                            />
                            <GradientButton
                                title="VERIFY CODE"
                                onPress={ handleVerifyOTP }
                                loading={ false }
                                size="large"
                                style={ styles.submitBtn }
                            />
                            <Pressable onPress={ handleSendOTP } style={ styles.resendBtn }>
                                <Text style={ styles.resendText }>
                                    { loading ? 'Sending...' : 'Resend Code' }
                                </Text>
                            </Pressable>
                        </View>
                    ) }

                    {/* Step: New Password */ }
                    { step === STEP.NEW_PASSWORD && (
                        <View style={ styles.form }>
                            <InputField
                                label="New Password"
                                inputRef={ passRef }
                                value={ newPassword }
                                onChangeText={ setNewPassword }
                                placeholder="Minimum 6 characters"
                                icon="lock-closed-outline"
                                secureTextEntry
                                returnKeyType="next"
                                onSubmitEditing={ () => confirmRef.current?.focus() }
                                error={ errors.newPassword }
                            />
                            <InputField
                                label="Confirm Password"
                                inputRef={ confirmRef }
                                value={ confirmPassword }
                                onChangeText={ setConfirmPassword }
                                placeholder="Re-enter your password"
                                icon="lock-closed-outline"
                                secureTextEntry
                                returnKeyType="done"
                                onSubmitEditing={ handleResetPassword }
                                error={ errors.confirmPassword }
                            />
                            <GradientButton
                                title="RESET PASSWORD"
                                onPress={ handleResetPassword }
                                loading={ loading }
                                size="large"
                                style={ styles.submitBtn }
                            />
                        </View>
                    ) }

                    {/* Step: Done */ }
                    { step === STEP.DONE && (
                        <View style={ styles.form }>
                            <GradientButton
                                title="SIGN IN"
                                onPress={ () => navigation.navigate('Login') }
                                size="large"
                                style={ styles.submitBtn }
                            />
                        </View>
                    ) }
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xxl,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xxl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(26, 58, 245, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.primaryDark,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    stepRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.xxxl,
    },
    stepDot: {
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
    },
    form: {},
    submitBtn: {
        marginTop: Spacing.md,
    },
    resendBtn: {
        alignSelf: 'center',
        marginTop: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
});

export default ForgotPasswordScreen;
