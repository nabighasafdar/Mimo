import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import AgeScreen from './screens/AgeScreen';
import NameScreen from './screens/NameScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import PlaceholderScreen from './screens/PlaceholderScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Name: undefined;
  Age: {name: string};
  Income: {name: string};
  Currency: {name: string};
  Home: {name: string};
  ScanReceipt: {name: string};
  AIResult: {name: string};
};

// Order of the Figma flow; used by screens that haven't been built yet.
export const FLOW: (keyof RootStackParamList)[] = [
  'Welcome',
  'Name',
  'Age',
  'Income',
  'Currency',
  'Home',
  'ScanReceipt',
  'AIResult',
];

const Stack = createNativeStackNavigator<RootStackParamList>();

function Name({navigation}: NativeStackScreenProps<RootStackParamList, 'Name'>) {
  return (
    <NameScreen
      onBack={() => navigation.goBack()}
      onContinue={name => navigation.navigate('Age', {name})}
    />
  );
}

function Welcome({navigation}: NativeStackScreenProps<RootStackParamList, 'Welcome'>) {
  return (
    <WelcomeScreen
      onStart={() => navigation.navigate('Name')}
      onHaveAccount={() => navigation.navigate('Home', {name: ''})}
    />
  );
}

function Age({navigation, route}: NativeStackScreenProps<RootStackParamList, 'Age'>) {
  return (
    <AgeScreen
      name={route.params.name}
      onBack={() => navigation.goBack()}
      onContinue={() => navigation.navigate('Income', {name: route.params.name})}
    />
  );
}

// Swap each Placeholder for the real screen as it is built from Figma.
const placeholder = (route: keyof RootStackParamList) => () =>
  <PlaceholderScreen route={route} />;

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{headerShown: false, animation: 'slide_from_right'}}>
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="Name" component={Name} />
        <Stack.Screen name="Age" component={Age} />
        <Stack.Screen name="Income" component={placeholder('Income')} />
        <Stack.Screen name="Currency" component={placeholder('Currency')} />
        <Stack.Screen name="Home" component={placeholder('Home')} />
        <Stack.Screen name="ScanReceipt" component={placeholder('ScanReceipt')} />
        <Stack.Screen name="AIResult" component={placeholder('AIResult')} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
