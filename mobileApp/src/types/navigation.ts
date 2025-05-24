import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  TabNavigator: undefined;
  EventPayment: {
    event: {
      id: string;
      name: string;
      date: string;
      location: string;
      image: any;
    };
    seatNumber: string;
  };
  EventQRCode: {
    event: {
      id: string;
      name: string;
      date: string;
      location: string;
      image: any;
    };
    seatNumber: string;
    bookingDetails: {
      name: string;
      email: string;
      phone: string;
    };
  };
  SurahDetailScreen: {
    surahNumber: number;
    surahName: string;
    totalAyahs: number;
  };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 