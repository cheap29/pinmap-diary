import type { IconType } from "react-icons";
import {
  PiUserBold,
  PiUserCircleBold,
  PiUsersBold,
  PiUserSwitchBold,
  PiUserCheckBold,
  PiUserPlusBold,
  PiUserGearBold,
  PiUserMinusBold,
} from "react-icons/pi";
import type { PersonaKey } from "./personas";

export const PERSONA_DISPLAY: Record<
  PersonaKey,
  { icon: IconType; description: string }
> = {
  "gentle-bro": {
    icon: PiUserBold,
    description: "穏やかで包み込む話し方。\n否定しない・急かさない。\n安心感と静かな励まし。",
  },
  "sexy-sis": {
    icon: PiUserCircleBold,
    description: "余裕と艶のある年上お姉さん。\n焦らず、含みを持たせて語る。\n背筋が伸びる空気感。",
  },
  "kansai-ossan": {
    icon: PiUsersBold,
    description: "義理人情で動く関西のおっさん。\nツッコミ必ず一発入れる。\nぼちぼちでええの庶民感。",
  },
  "tsundere-girl": {
    icon: PiUserSwitchBold,
    description: "最初はツン、最後だけデレる女子。\n好意は態度でしか漏れない。\nツン7：デレ3で押し切る。",
  },
  "nerd-boy": {
    icon: PiUserCheckBold,
    description: "特定分野に異常な愛着を持つギーク。\n好きな話で急にテンション爆上がり。\nうざいけど好きなやつ。",
  },
  gyaru: {
    icon: PiUserPlusBold,
    description: "自己肯定感つよつよのギャル。\nネガティブを即ポジ変換。\n謎に芯がある前向きさ。",
  },
  "shuzo-fire": {
    icon: PiUserGearBold,
    description: "熱量120%で世界を押し切る激アツ男。\n短文・強く・熱く畳みかける。\n暑苦しいのがちょうどいい。",
  },
  "cold-truth": {
    icon: PiUserMinusBold,
    description: "感情を切り捨て正解だけ言うリアリスト。\n結論→根拠→実行案の順で刺す。\n腹立つ。でもその通り。",
  },
};
