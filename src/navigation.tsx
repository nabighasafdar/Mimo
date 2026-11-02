import React from 'react';
import {Alert} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator, NativeStackScreenProps} from '@react-navigation/native-stack';
import {ParsedExpense, parseExpenses} from './voiceParse';
import {Receipt, readSpoken} from './receipt';
import {signOutOfGoogle} from './googleAuth';
import {sameMonth, spendingAlert} from './budget';
import {NewExpense, StoreProvider, useMoney, useStore} from './store';
import AgeScreen from './screens/AgeScreen';
import CurrencyScreen from './screens/CurrencyScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import GoalsScreen from './screens/GoalsScreen';
import HomeScreen from './screens/HomeScreen';
import IncomeScreen from './screens/IncomeScreen';
import LoginScreen from './screens/LoginScreen';
import MeScreen from './screens/MeScreen';
import NameScreen from './screens/NameScreen';
import ResultScreen from './screens/ResultScreen';
import SavingsScreen from './screens/SavingsScreen';
import ScanScreen from './screens/ScanScreen';
import SignUpScreen from './screens/SignUpScreen';
import StatsScreen from './screens/StatsScreen';
import VoiceResultScreen from './screens/VoiceResultScreen';
import VoiceScreen from './screens/VoiceScreen';
import WelcomeScreen from './screens/WelcomeScreen';

// `edit` is set when a screen is opened from Me to change an answer, not during onboarding.
export type RootStackParamList = {
  Welcome: undefined;
  Name: {edit?: boolean} | undefined;
  Age: {edit?: boolean} | undefined;
  Income: {edit?: boolean} | undefined;
  Currency: {edit?: boolean} | undefined;
  SignUp: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Stats: undefined;
  Goals: undefined;
  Me: undefined;
  Savings: undefined;
  ScanReceipt: undefined;
  AIResult: {receipt: Receipt};
  Voice: undefined;
  VoiceResult: {transcript: string; items: ParsedExpense[]};
};

type Props<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function Welcome({navigation}: Props<'Welcome'>) {
  return (
    <WelcomeScreen
      onStart={() => navigation.navigate('Name')}
      onHaveAccount={() => navigation.navigate('Login')}
    />
  );
}

function Name({navigation, route}: Props<'Name'>) {
  const {profile, setProfile} = useStore();
  return (
    <NameScreen
      initialName={profile.name}
      onBack={() => navigation.goBack()}
      onContinue={name => {
        setProfile({name});
        navigation.navigate('Age', route.params);
      }}
    />
  );
}

function Age({navigation, route}: Props<'Age'>) {
  const {profile, setProfile} = useStore();
  const edit = route.params?.edit;
  return (
    <AgeScreen
      name={profile.name}
      initialAge={profile.age}
      onBack={() => navigation.goBack()}
      onContinue={age => {
        setProfile({age});
        if (edit) {
          navigation.popTo('Me');
        } else {
          navigation.navigate('Income');
        }
      }}
    />
  );
}

function Income({navigation, route}: Props<'Income'>) {
  const {profile, setProfile} = useStore();
  const edit = route.params?.edit;
  return (
    <IncomeScreen
      initialPicked={profile.incomeType}
      initialAmount={profile.amount}
      onBack={() => navigation.goBack()}
      onContinue={(incomeType, amount) => {
        setProfile({incomeType, amount});
        if (edit) {
          navigation.popTo('Me');
        } else {
          navigation.navigate('Currency');
        }
      }}
    />
  );
}

function Currency({navigation, route}: Props<'Currency'>) {
  const {profile, setProfile} = useStore();
  const edit = route.params?.edit;
  return (
    <CurrencyScreen
      initialCode={profile.currency.code}
      confirmLabel={edit ? 'Save' : "All set, let's go!"}
      onBack={() => navigation.goBack()}
      onContinue={currency => {
        setProfile({currency});
        if (edit) {
          navigation.popTo('Me');
        } else {
          navigation.navigate('SignUp');
        }
      }}
    />
  );
}

// Reset so Back from Home doesn't return into onboarding or auth.
function useEnterApp(navigation: Props<'SignUp' | 'Login'>['navigation']) {
  const {enter} = useStore();
  return async () => {
    await enter();
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  };
}

function SignUp({navigation}: Props<'SignUp'>) {
  const {profile} = useStore();
  const enterApp = useEnterApp(navigation);
  return (
    <SignUpScreen
      name={profile.name}
      onBack={() => navigation.goBack()}
      onDone={enterApp}
      onLogin={() => navigation.navigate('Login')}
    />
  );
}

function Login({navigation}: Props<'Login'>) {
  const enterApp = useEnterApp(navigation);
  return (
    <LoginScreen
      onBack={() => navigation.goBack()}
      onDone={enterApp}
      onForgot={() => navigation.navigate('ForgotPassword')}
      onSignUp={() => navigation.navigate('SignUp')}
    />
  );
}

function ForgotPassword({navigation}: Props<'ForgotPassword'>) {
  return (
    <ForgotPasswordScreen onBack={() => navigation.goBack()} onLogin={() => navigation.goBack()} />
  );
}

function Home({navigation}: Props<'Home'>) {
  return (
    <HomeScreen
      onTellMimo={() => navigation.navigate('Voice')}
      onEditSavings={() => navigation.navigate('Savings')}
    />
  );
}

function Savings({navigation}: Props<'Savings'>) {
  return <SavingsScreen onBack={() => navigation.goBack()} onSaved={() => navigation.goBack()} />;
}

// Saves new expenses, returns to Home, and warns when they push this month's spending past
// 80% of what the user can spend, or into their savings.
function useAddExpenses(navigation: Props<'AIResult' | 'VoiceResult'>['navigation']) {
  const {addExpenses, spent, budget, savingsGoal, today, prefs} = useStore();
  const money = useMoney();
  return (items: NewExpense[]) => {
    addExpenses(items);
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
    const added = items
      .filter(i => !i.date || sameMonth(i.date, today))
      .reduce((sum, i) => sum + i.amount, 0);
    const alert = spendingAlert(spent, added, budget, savingsGoal, money);
    if (alert && prefs.savingsAlerts) {
      Alert.alert('Savings check', alert);
    }
  };
}

function Me({navigation}: Props<'Me'>) {
  const {reset} = useStore();
  return (
    <MeScreen
      onEditPersonal={() => navigation.navigate('Name', {edit: true})}
      onEditIncome={() => navigation.navigate('Income', {edit: true})}
      onEditCurrency={() => navigation.navigate('Currency', {edit: true})}
      onEditSavings={() => navigation.navigate('Savings')}
      onLogout={async () => {
        signOutOfGoogle();
        await reset();
        navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
      }}
    />
  );
}

function ScanReceipt({navigation}: Props<'ScanReceipt'>) {
  return (
    <ScanScreen
      onBack={() => navigation.goBack()}
      onScanned={receipt => navigation.navigate('AIResult', {receipt})}
    />
  );
}

function AIResult({navigation, route}: Props<'AIResult'>) {
  const add = useAddExpenses(navigation);
  return (
    <ResultScreen receipt={route.params.receipt} onBack={() => navigation.goBack()} onAdd={add} />
  );
}

function Voice({navigation}: Props<'Voice'>) {
  return (
    <VoiceScreen
      onBack={() => navigation.goBack()}
      onDone={async transcript => {
        // The AI names each item and picks its category; offline, fall back to keywords.
        let items: ParsedExpense[];
        try {
          items = (await readSpoken(transcript)).map(i => ({
            amount: Math.round(i.amount),
            category: i.category,
            note: i.name,
          }));
        } catch {
          items = parseExpenses(transcript);
        }
        navigation.navigate('VoiceResult', {transcript, items});
      }}
    />
  );
}

function VoiceResult({navigation, route}: Props<'VoiceResult'>) {
  const add = useAddExpenses(navigation);
  return (
    <VoiceResultScreen
      transcript={route.params.transcript}
      items={route.params.items}
      onBack={() => navigation.goBack()}
      onSayAgain={() => navigation.goBack()}
      onAdd={add}
    />
  );
}

function Routes() {
  const {signedIn} = useStore();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={signedIn ? 'Home' : 'Welcome'}
        screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Name" component={Name} />
        <Stack.Screen name="Age" component={Age} />
        <Stack.Screen name="Income" component={Income} />
        <Stack.Screen name="Currency" component={Currency} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Home" component={Home} options={{animation: 'none'}} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{animation: 'none'}} />
        <Stack.Screen name="Goals" component={GoalsScreen} options={{animation: 'none'}} />
        <Stack.Screen name="Me" component={Me} options={{animation: 'none'}} />
        <Stack.Screen name="Savings" component={Savings} />
        <Stack.Screen name="ScanReceipt" component={ScanReceipt} />
        <Stack.Screen name="AIResult" component={AIResult} />
        <Stack.Screen name="Voice" component={Voice} />
        <Stack.Screen name="VoiceResult" component={VoiceResult} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function Navigation() {
  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  );
}
