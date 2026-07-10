import { useEffect, useRef } from "react";
import { Animated } from "react-native";

type Props = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
};

export default function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
}: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: width as any,
        height: height as number,
        borderRadius,
        backgroundColor: "#3A3A3A",
        opacity,
      }}
    />
  );
}
