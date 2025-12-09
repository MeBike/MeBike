import React from "react";
import { useNavigation } from "@react-navigation/native";

import { ScreenHeader } from "@components/ScreenHeader";

type Props = {
  title: string;
  onBackPress?: () => void;
};


const BookingDetailHeader = ({ title, onBackPress }: Props) => {
  const navigation = useNavigation();
  
  return (
    <ScreenHeader
      title={title}
      onBackPress={onBackPress ?? (() => navigation.goBack())}
    />
  );
};

export default BookingDetailHeader;
