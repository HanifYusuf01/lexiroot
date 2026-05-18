import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { SkillKey } from '../../constants/theme';

interface SkillIconProps {
  skill: SkillKey;
  size?: number;
  color: string;
}

export function SkillIcon({ skill, size = 20, color }: SkillIconProps) {
  switch (skill) {
    case 'listen-select':
      return <Ionicons name="volume-high" size={size} color={color} />;
    case 'vocabulary':
      return <MaterialCommunityIcons name="layers" size={size} color={color} />;
    case 'sentence':
      return <Ionicons name="mic" size={size} color={color} />;
    case 'recognition':
      return <MaterialCommunityIcons name="file-search" size={size} color={color} />;
  }
}
