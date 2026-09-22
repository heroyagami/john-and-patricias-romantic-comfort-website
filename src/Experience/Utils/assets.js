const isIOS =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isMobile = isIOS || /Android|Mobile/i.test(navigator.userAgent);

const ext = isMobile ? "ktx2" : "webp";
const weddingPhotoVersion = "20260921-1";
const weddingStoryVersion = "20260921-1";
const mobileTextureVersion = "20260922-1";
const dayTexturePath = (name, desktopVersion = "") =>
  isMobile
    ? `/textures/mobile/${name}_day.webp?v=${mobileTextureVersion}`
    : `/textures/day/${name}_day.webp${desktopVersion ? `?v=${desktopVersion}` : ""}`;

const assets = [
  {
    name: "room",
    type: "glbModel",
    path: "/models/Room.glb",
  },
  {
    name: "houseReplacement",
    type: "glbModel",
    path: "/models/HouseReplacement-v3.glb",
    defer: true,
  },
  {
    name: "hitboxes",
    type: "glbModel",
    path: "/models/Hitboxes.glb",
  },
  {
    name: "goboTexture",
    type: "texture",
    path: "/textures/gobo.jpg",
  },
  {
    name: "butterflyWingTexture",
    type: "texture",
    path: "/textures/butterfly_wing.webp",
  },
  {
    name: "firstTexture",
    type: "texture",
    path: dayTexturePath("first-house"),
  },
  {
    name: "secondTexture",
    type: "texture",
    path: dayTexturePath("second-photos", weddingPhotoVersion),
  },
  {
    name: "thirdTexture",
    type: "texture",
    path: dayTexturePath("third-desk"),
  },
  {
    name: "fourthTexture",
    type: "texture",
    path: dayTexturePath("fourth-extras"),
  },
  {
    name: "fifthTexture",
    type: "texture",
    path: dayTexturePath("fifth-background"),
  },
  {
    name: "sixthTexture",
    type: "texture",
    path: dayTexturePath("sixth-plants"),
  },
  {
    name: "seventhTexture",
    type: "texture",
    path: dayTexturePath("seventh-large-stuff"),
  },
  {
    name: "eighthTexture",
    type: "texture",
    path: dayTexturePath("eighth-decor"),
  },
  {
    name: "ninthTexture",
    type: "texture",
    path: dayTexturePath("ninth-attachment", weddingStoryVersion),
  },
  {
    name: "firstNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/first-house_night.${ext}`,
  },
  {
    name: "secondNightTexture",
    type: "texture",
    path: `/textures/night/second-photos_night.webp?v=${weddingPhotoVersion}`,
  },
  {
    name: "thirdNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/third-desk_night.${ext}`,
  },
  {
    name: "fourthNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/fourth-extras_night.${ext}`,
  },
  {
    name: "fifthNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/fifth-background_night.${ext}`,
  },
  {
    name: "sixthNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/sixth-plants_night.${ext}`,
  },
  {
    name: "seventhNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/seventh-large-stuff_night.${ext}`,
  },
  {
    name: "eighthNightTexture",
    type: isMobile ? "ktx2" : "texture",
    path: `/textures/night/eighth-decor_night.${ext}`,
  },
  {
    name: "ninthNightTexture",
    type: "texture",
    path: `/textures/night/ninth-attachment_night.webp?v=${weddingStoryVersion}`,
  },
  // {
  //   name: "skybox",
  //   type: "skybox",
  //   path: [
  //     "/textures/skybox/px.png",
  //     "/textures/skybox/nx.png",
  //     "/textures/skybox/py.png",
  //     "/textures/skybox/ny.png",
  //     "/textures/skybox/pz.png",
  //     "/textures/skybox/nz.png",
  //   ],
  // },
];

// Mobile browsers have tight memory limits. Loading both complete 4K texture
// sets before entry delays the first screen and can make WeChat reload the tab.
// On mobile the day textures are reused while night lighting still changes.
export default assets.filter(
  (asset) => !isMobile || !asset.name.endsWith("NightTexture"),
);
