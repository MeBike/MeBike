import { Text, View } from "react-native";
import { useTheme } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";

type StationMapMarkerProps = {
  count: number;
  isSelected?: boolean;
};

export function StationMapMarker({ count, isSelected = false }: StationMapMarkerProps) {
  const theme = useTheme();
  const markerColor = count === 0 ? theme.statusDanger.val : theme.actionPrimary.val;
  const markerStyle = {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: markerColor,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: isSelected ? 3 : 2,
    borderColor: isSelected ? theme.borderFocus.val : theme.surfaceDefault.val,
    shadowColor: theme.shadowColor.val,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isSelected ? 0.3 : 0.25,
    shadowRadius: isSelected ? 6 : 4,
    elevation: isSelected ? 7 : 5,
    ...(isSelected ? { transform: [{ scale: 1.12 }] } : {}),
  };

  return (
    <View
      style={{
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={markerStyle}
      >
        <IconSymbol color={theme.onActionPrimary.val} name="bike" size="input" />
      </View>

      {count > 0
        ? (
            <View
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 5,
                borderRadius: 9,
                backgroundColor: theme.surfaceDefault.val,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: isSelected ? theme.borderFocus.val : theme.borderSubtle.val,
              }}
            >
              <Text
                style={{
                  color: theme.actionPrimary.val,
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {count}
              </Text>
            </View>
          )
        : null}
    </View>
  );
}
