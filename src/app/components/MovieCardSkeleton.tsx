import { View } from "react-native";
import Skeleton from "./Skeleton";

export default function MovieCardSkeleton() {
  return (
    <View style={{ flex: 1 }}>
      <Skeleton height={180} borderRadius={12} />
      <View style={{ marginTop: 6, gap: 4 }}>
        <Skeleton height={14} width="80%" borderRadius={4} />
        <Skeleton height={12} width="40%" borderRadius={4} />
      </View>
    </View>
  );
}
