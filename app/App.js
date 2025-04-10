// expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-reanimated @react-navigation/drawer react-native-gesture-handler react-native-reanimated
import React, { useState, useRef, useEffect, useCallback } from 'react'; // import react components
import {
  Text,
  View,
  SafeAreaView,
  Button,
  ImageBackground,
  Image,
  TouchableOpacity,
  Animated,
  Pressable,
  Dimensions,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native'; // import react native components
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native'; // import navigation center components
import { useFocusEffect } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer'; // import navigation drawer components
import ImageZoom from 'react-native-image-pan-zoom'; // import image zoom components
import { AntDesign } from '@expo/vector-icons'; // import expo icons components
import { useFonts } from 'expo-font'; // import font component
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { images, sounds, music, fonts } from './assets.js'; // static requires

/*
 * UAT MS579 React Native
 *
 * Week 4
 * Assignment 4.2 and 4.3
 *
 * By Matt Lindborg
 */

/*
 * Development Notes
 * Week 1
 * Added text and inline styling to the elements on the page for assignment 1.2. Not happy with the assignment, but submitted it anyway.
 */
/*
 * Week 2
 * Added images and background images to the app. I am not sure, but it seems expo snacks only allow the use of the App.js file as the main jumping off point for the app. Frustrated that I was not able to import everything I needed, until I found the version specific for expo snacks. I added navigation and images to the gallery page, which can be accessible through an array of images. Next step is hopefully image manipulation and movement and polishing. Need to add in comments on elements I added in today.
 * Exploring the use of a hamburger drop down menu instead of buttons. Also recolored a lot of elements to be more of a black and gray theme. Going to add an image into the background at some point as well, after I ai generate it.
 * Need to add some kind of box behind the text on different pages, with a low opacity, to refine the look of the screens and make the text more readable. Add in more background images as well. Maybe round the text box corners.
 * Need to add more comments on what all the code does. I should have the majority of what I wanted to accomplish finished. 6 hours of work or so done.
 */
/*
 * Week 3
 * I want to make more elements pressable and able to interact with the user. I am planning on making the Paint Warrior a pressable, then the text box will display with what he has to say. I am not sure how yet, but I might make him a movable element on the screens, changing what he says based on the screen. Another element I might add is a pressable component to add images to the gallery, dynamically updating the image array.
 * I was able to add a color wheel screen to the app. Also made the image able to zoom and move. Added the functionality to the image being displayed on the gallery screen. I want to add the trophy room and start working on the actual direction of the app. It is supposed to keep miniature painters motivated. I am going to lean into that as much as possible. I also added a font to the app, which makes everything so much cooler.
 * I am working on the flow of the application, how to utilize the mechanic of the campaign idea, or painting project, and how I want to interface with the user. A lot of troubleshooting and trial and error. I have spent at least 8 hours already on development this week, with probably a few more on polishing.
 * Completely refactored a ton of code to try to bring things inline and inside the campaignsScreen function. Still need to add code to add, edit, and delete warriors from the campaigns. Still planning on trying to make another new screen for a single campaign, using the current campaignsScreen as the hub. Then the
 */
/*
 * Week 4
 * Adding sound into the app. Probably focus on a fanfare type of sound for the trophy room, and add a trophy for visiting the trophy room. Added a sound for getting a trophy. Working on getting a sound for the splash screen. Decided to use sounds from warcraft 2 paladin. Seems fitting. I have the edit function and expanded menu stuff working in the campaign and warriors screens. I am thinking about getting rid of the entire active campaign thing, and making the campaign title navigate back to the campaign menu. If I am going to have images associated with each campaign itself, and then each warrior has their own, I don't need an active campaign icon or setting. Maybe just implement a tracking system for the last place the user was, then update the name on the home screen to be the location they last were. Eventually I need to refactor the look of all of the expanding menus and overally ui. Make it better somehow. Maybe have the background color of the cards be transparent and the text all be a green similar to what might be displayed on a computer screen from the 80s. Added background music.
 *
 */

// global drawer variable
const Drawer = createDrawerNavigator();

// theme used across app
const theme = {
  fonts,
  colors: {
    background: 'black',
    text: 'white',
    accent: '#36454F',
    overlay: 'rgba(0, 0, 0, 0.65)',
    overlayStrong: 'rgba(0, 0, 0, 0.75)',
  },
  images,
  sounds,
  music,
};


// global cache for all sound instances
const loadedSounds = {};

// load sound object
const loadSound = async (soundFile) => {
  const fileKey = soundFile.toString(); // keys should be consistent
  if (!loadedSounds[fileKey]) {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    loadedSounds[fileKey] = sound;
  }
};

// play sound object
const playSound = async (soundFile) => {
  const fileKey = soundFile.toString();
  let sound = loadedSounds[fileKey];

  if (!sound) {
    const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
    sound = newSound;
    loadedSounds[fileKey] = sound;
  }

  try {
    await sound.replayAsync();
  } catch (e) {
    console.warn('Error playing sound:', e);
  }
};

// trophy logic
const TROPHY_KEY = 'trophiesAchieved';

// get trophies achieved object
const getAchievedTrophies = async () => {
  const data = await AsyncStorage.getItem(TROPHY_KEY);
  return data ? JSON.parse(data) : {};
};

// award trophy object
const awardTrophy = async (id, theme) => {
  const trophies = await getAchievedTrophies();
  if (trophies[id]) return false;

  trophies[id] = {
    achieved: true,
    timestamp: new Date().toISOString(),
  };
  await AsyncStorage.setItem(TROPHY_KEY, JSON.stringify(trophies));

  if (theme?.sounds?.splash) playSound(theme.sounds.trophy);
  return true;
};

// reset trophyies object
const resetTrophies = async () => {
  await AsyncStorage.removeItem(TROPHY_KEY);
};

/*
 * home screen function
 *
 * Main screen of the app, introduces the user to the idea of the app.
 * Includes a picture of a robotic hand painting a minitaure warrior.
 * Also introduces the paint warrior, the helper character there to give suggestions.
 * The image of the paint warrior overlays the background image.
 *
 */
function HomeScreen({ navigation, activeCampaign }) {
  // state variables
  const [isVisible, setIsVisible] = useState(false);
  // navigation to the campaigns screen
  const handlePress = () => {
    navigation.navigate('Campaigns');
  };
  // dynamic label based on having an active campaign or not
  const buttonLabel = activeCampaign
    ? `▶️ Resume "${activeCampaign.name}"`
    : '🚀 Start a New Campaign';
  // renders the home screen, including pressable helper object and dynamic campaigns button
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        style={styles.fullFlex}
        resizeMode="cover"
        source={theme.images.home}>
        <View style={styles.headerBlock}>
          <Text style={[styles.heading, styles.overlayBox]}>
            Welcome Commander
          </Text>
        </View>
        <View style={styles.helperRow}>
          <Pressable onPress={() => setIsVisible(!isVisible)}>
            <Image style={styles.helperIcon} source={theme.images.helper} />
          </Pressable>
          {isVisible && (
            <Text style={styles.helperText}>🔍 Let's get painting!</Text>
          )}
        </View>
        <View style={styles.bottomTextBlock}>
          <Text style={styles.infoText}>
            {activeCampaign
              ? `Your campaign "${activeCampaign.name}" awaits.`
              : 'Start a new painting campaign to build your army.'}
          </Text>
        </View>
        <Pressable onPress={handlePress}>
          <Text style={styles.launchButton}>{buttonLabel}</Text>
        </Pressable>
      </ImageBackground>
    </SafeAreaView>
  );
}

/*
 * color wheel screen function
 *
 * A quick reference color wheel that is able to be zoomed in on and moved around for ease of use.
 *
 */
function ColorWheelScreen() {
  // visibility state index variables
  const [isVisible, setIsVisible] = useState(false);
  // dimensions of image
  const { width, height } = Dimensions.get('window');
  // image zoom reference
  const imageZoomRef = useRef(null);
  // render the image and manipulate it and be zoomable
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <ImageZoom
        ref={imageZoomRef}
        cropWidth={width}
        cropHeight={height}
        imageWidth={width}
        imageHeight={height}
        minScale={1}
        maxScale={3}
        onDoubleClick={() => imageZoomRef.current?.reset()}
        >
        <Image
          style={{ width: width, height: height }}
          source={theme.images.colorWheel}
          resizeMode="contain"
        />
      </ImageZoom>
      <View
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          flexDirection: 'row-reverse',
          alignItems: 'center',
        }}>
        <Pressable onPress={() => setIsVisible(!isVisible)}>
          <Image
            style={{
              height: 40,
              width: 40,
              justifyContent: 'right',
              alignSelf: 'flex-end',
            }}
            source={theme.images.helper}
          />
        </Pressable>
        {isVisible && (
          <Text style={styles.helperText}>🔍Double tap to reset!</Text>
        )}
      </View>
    </View>
  );
}

/*
 * gallery screen function
 *
 * Displays a series of images in a gallery, able to be looked through usng arrow buttons.
 * The images are listed in a multidimensional array, with the file and associated description.
 * The background image is a themed display screen, with the gallery image shown in the the center.
 * The Paint Warrior overlays the background image as well.
 *
 */

function GalleryScreen({ navigation }) {
  // images multi-dimensional array, including the file and description
  const galleryImages = [
    {
      file: theme.images.orks,
      description: 'Bruce and his ride are assembled.',
    },
    {
      file: theme.images.bruce,
      description: 'Not all of these orks are painted.',
    },
  ];
  // visibility state index variables
  const [isVisible, setIsVisible] = useState(false);
  // dimensions of image
  const { width, height } = Dimensions.get('window');
  // image zoom reference
  const imageZoomRef = useRef(null);
  // piece of state index, starting at 0, to track the image selected in the array.
  const [index, setIndex] = useState(0);
  // increments the image array index by 1, with a wrap around to start from the beginning once the last index is reached.
  const goNext = () => setIndex((prev) => (prev + 1) % galleryImages.length);
  // decrements the image array index to go backward, using 1 + to never go negative, then wrap after last index reached.
  const goPrev = () =>
    setIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  // renders the gallery display, with pressable arrows for navigation
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <ImageBackground
        style={{ flex: 1 }}
        resizeMode="cover"
        source={theme.images.galleryBackground}>
        <View
          style={{
            flex: 1,
            width: '85%',
            height: 385,
            paddingTop: 80,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
          }}>
          {' '}
          <ImageZoom
            ref={imageZoomRef}
            cropWidth={width}
            cropHeight={height}
            imageWidth={width * 0.9}
            imageHeight={height * 0.9}
            minScale={1}
            maxScale={3}
            onDoubleClick=
            {() => {
              imageZoomRef.current?.reset();
            }}
            >
            <Image
              style={{ width: width, height: height, alignItems: 'center' }}
              source={galleryImages[index].file}
              resizeMode="contain"
            />
          </ImageZoom>
        </View>
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            flexDirection: 'row-reverse',
            alignItems: 'center',
          }}>
          <Pressable onPress={() => setIsVisible(!isVisible)}>
            <Image
              style={{
                height: 40,
                width: 40,
                justifyContent: 'right',
                alignSelf: 'flex-end',
              }}
              source={theme.images.helper}
            />
          </Pressable>
          {isVisible && (
            <Text style={styles.helperText}>
              🔍Double tap to reset the image!
            </Text>
          )}
        </View>
        <View
          style={{
            alignItems: 'center',
            padding: 10,
            borderRadius: 6,
          }}>
          {' '}
          <Text
            style={{
              fontSize: 20,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.65)',
              padding: 5,
              borderRadius: 10,
              textAlign: 'center',
              marginTop: 10,
            }}>
            {galleryImages[index].description}
          </Text>{' '}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 20,
            }}>
            {' '}
            <TouchableOpacity onPress={goPrev}>
              <AntDesign name="leftcircle" size={48} color="white" />
            </TouchableOpacity>
            <Text
              style={{
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
                backgroundColor: 'rgba(0,0,0,0.65)',
              }}>
              {index + 1} / {galleryImages.length}
            </Text>{' '}
            <TouchableOpacity onPress={goNext}>
              <AntDesign name="rightcircle" size={48} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/*
 * about screen function
 *
 * Describes the purpose and future improvements for the app.
 * Background image is a stylized question mark, since this would be the place for app info.
 * The picture of the Paint Warrior overlays the background image, describing himself.
 *
 */
function AboutScreen({ navigation }) {
  // visibility state index variables
  const [isVisible, setIsVisible] = useState(false);
  // renders the about info in a header and text block
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <ImageBackground
        style={{ height: '100%', width: '100%' }}
        source={theme.images.about}>
        <View
          style={{
            flexDirection: 'row-reverse',
            padding: 10,
            justifyContent: 'right',
            alignItems: 'right',
            paddingTop: 10,
          }}>
          <Pressable onPress={() => setIsVisible(!isVisible)}>
            <Image
              style={{
                height: 40,
                width: 40,
                justifyContent: 'right',
                alignSelf: 'flex-end',
              }}
              source={theme.images.helper}
            />{' '}
            // paint warrior image
          </Pressable>
          {isVisible && (
            <Text
              style={{
                color: '#33ceff',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                fontSize: 20,
                fontWeight: 'bold',
                alignSelf: 'flex-end',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
              🔍I am the helpful Paint Warrior!
            </Text>
          )}
        </View>
        <View
          style={{
            paddingLeft: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: 24,
              marginBottom: 20,
              backgroundColor: 'rgba(0, 0, 0, .75)',
              paddingBottom: 10,
              borderRadius: 6,
            }}>
            🎨 About This App
          </Text>
          <Text
            style={{
              color: 'white',
              fontSize: 20,
              textAlign: 'left',
              padding: 5,
              borderRadius: 6,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
            }}>
            This app helps you stay motivated while painting miniatures with
            goal tracking and rewards!
            {'\n'}This app will gamify miniature painting.
            {'\n'}It will have pages and interfaces to track painting progress
            and multiple areas for notes.
            {'\n'}It will also incentivize painters with achievements for
            reaching goals.
            {'\n'}Some of the different ideas for pages are a home page,
            painting tracker, achievement badge trophy room, daily painting
            tracker, paint recipe vault, profile information and statistics
            tracking, settings and customization, a color wheel, and ability to
            add reminders and notifications.
          </Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/*
 * campaigns screen function
 *
 * includes code for creating, editing, and deleting a campaign, as well as the warriors associated with the campaign.
 */
function CampaignsScreen({
  campaigns,
  setCampaigns,
  activeCampaign,
  setActiveCampaign,
  navigation,
}) {
  useEffect(() => {
    const persist = async () => {
      await AsyncStorage.setItem('campaigns', JSON.stringify(campaigns));
    };

    if (campaigns.length) {
      persist();
    }
  }, [campaigns]);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    desc: '',
    imageUri: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [editCampaign, setEditCampaign] = useState({
    name: '',
    desc: '',
    imageUri: null,
  });
  const [newExpanded, setNewExpanded] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState({});

  useEffect(() => {
    const persist = async () => {
      const existing = await AsyncStorage.getItem('campaigns');
      const existingParsed = existing ? JSON.parse(existing) : [];

      // only persist if actual data differs
      if (JSON.stringify(existingParsed) !== JSON.stringify(campaigns)) {
        await AsyncStorage.setItem('campaigns', JSON.stringify(campaigns));
      }
    };
    persist();
  }, [campaigns]);
  // handle image chosen by user
  const handlePickImage = async (setUri) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setUri(result.assets[0].uri);
    }
  };
  // add campaign object
  const addCampaign = async () => {
    if (!newCampaign.name.trim()) return;

    const camp = {
      id: Date.now().toString(),
      name: newCampaign.name,
      description: newCampaign.desc,
      image: newCampaign.imageUri
        ? { uri: newCampaign.imageUri }
        : theme.images.campaignsBackground,
      warriors: [],
    };

    await playSound(theme.sounds.campaign);
    setCampaigns((prev) => [...prev, camp]);
    setNewCampaign({ name: '', desc: '', imageUri: null });

    // close the form after adding
    setNewExpanded(false);

    // expand the new card just added
    setExpandedCampaigns((prev) => ({
      ...prev,
      [camp.id]: true,
    }));
  };
  // save edit
  const saveEdit = () => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === editingId
          ? {
              ...c,
              name: editCampaign.name,
              description: editCampaign.desc,
              image: editCampaign.imageUri
                ? { uri: editCampaign.imageUri }
                : c.image,
            }
          : c
      )
    );
    setEditingId(null);
  };
  // start edit
  const startEdit = (camp) => {
    setEditingId(camp.id);
    setEditCampaign({
      name: camp.name,
      desc: camp.description,
      imageUri: camp.image?.uri,
    });
  };

  const deleteCampaign = async (id) => {
    await playSound(theme.sounds.campaignRemove);
    setCampaigns(campaigns.filter((c) => c.id !== id));
  };

  // image associated with the card, with default if none selected
  const CardImage = ({ source, size = 60 }) => {
    const validSource =
      source?.uri || typeof source === 'number'
        ? source
        : theme.images.campaigns_screen; // default image

    return (
      <Image
        source={validSource}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          marginVertical: 6,
        }}
        resizeMode="cover"
      />
    );
  };
  // icon button
  const IconButton = ({ icon, label, onPress }) => (
    <Pressable onPress={onPress} style={styles.iconButton}>
      <AntDesign
        name={icon}
        size={20}
        color="white"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.iconButtonText}>{label}</Text>
    </Pressable>
  );
  // render campaigns
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ImageBackground
        style={styles.fullFlex}
        resizeMode="cover"
        source={theme.images.campaignsBackground}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={60}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.heading}>Campaigns</Text>
              <Text style={styles.subheading}>
                <Pressable onPress={() => setNewExpanded(!newExpanded)}>
                  <Text style={styles.subheading}>
                    {newExpanded ? '▼' : '▶'} New Campaign
                  </Text>
                </Pressable>
              </Text>
              {newExpanded && (
                <>
                  <TextInput
                    placeholder="Name"
                    value={newCampaign.name}
                    onChangeText={(text) =>
                      setNewCampaign({ ...newCampaign, name: text })
                    }
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Description"
                    value={newCampaign.desc}
                    onChangeText={(text) =>
                      setNewCampaign({ ...newCampaign, desc: text })
                    }
                    style={styles.input}
                  />
                  <IconButton
                    icon="picture"
                    label="Pick Image"
                    onPress={() =>
                      handlePickImage((uri) =>
                        setNewCampaign({ ...newCampaign, imageUri: uri })
                      )
                    }
                  />
                  <IconButton
                    icon="pluscircle"
                    label="Create"
                    onPress={addCampaign}
                  />
                </>
              )}
              <Text style={[styles.subheading, { marginTop: 20 }]}>
                Campaigns
              </Text>
              {campaigns.map((c) => {
                const isExpanded = expandedCampaigns[c.id];
                return (
                  <View key={c.id} style={styles.card}>
                    <Pressable
                      onPress={() =>
                        setExpandedCampaigns((prev) => ({
                          ...prev,
                          [c.id]: !prev[c.id],
                        }))
                      }>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CardImage source={c.image} size={40} />
                        <Text style={[styles.text, { marginLeft: 10 }]}>
                          {isExpanded ? '▼' : '▶'} {c.name}
                        </Text>
                      </View>
                    </Pressable>
                    {isExpanded && (
                      <>
                        {editingId === c.id ? (
                          <>
                            <TextInput
                              value={editCampaign.name}
                              onChangeText={(text) =>
                                setEditCampaign({ ...editCampaign, name: text })
                              }
                              style={styles.input}
                            />
                            <TextInput
                              value={editCampaign.desc}
                              onChangeText={(text) =>
                                setEditCampaign({ ...editCampaign, desc: text })
                              }
                              style={styles.input}
                            />
                            <IconButton
                              icon="picture"
                              label="Pick Image"
                              onPress={() =>
                                handlePickImage((uri) =>
                                  setEditCampaign({
                                    ...editCampaign,
                                    imageUri: uri,
                                  })
                                )
                              }
                            />
                            <IconButton
                              icon="save"
                              label="Save"
                              onPress={saveEdit}
                            />
                          </>
                        ) : (
                          <>
                            <Text style={styles.text}>{c.description}</Text>
                            <IconButton
                              icon="checkcircle"
                              label="Set Active"
                              onPress={() => {
                                if (activeCampaign?.id !== c.id) {
                                  setActiveCampaign(c);
                                  setTimeout(() => {
                                    AsyncStorage.setItem(
                                      'activeCampaign',
                                      JSON.stringify(c)
                                    );
                                  }, 200);
                                }
                              }}
                            />
                            <IconButton
                              icon="edit"
                              label="Edit"
                              onPress={() => startEdit(c)}
                            />
                            <IconButton
                              icon="delete"
                              label="Delete Campaign"
                              onPress={() => deleteCampaign(c.id)}
                            />
                            <IconButton
                              icon="team"
                              label="Manage Warriors"
                              onPress={() => {
                                setActiveCampaign(c);
                                AsyncStorage.setItem(
                                  'activeCampaign',
                                  JSON.stringify(c)
                                );
                                navigation.navigate('Warriors', {
                                  campaign: c,
                                  onUpdateCampaign: (updated) => {
                                    setCampaigns(
                                      campaigns.map((cam) =>
                                        cam.id === updated.id ? updated : cam
                                      )
                                    );
                                    setActiveCampaign(updated);
                                  },
                                  theme,
                                  playSound,
                                });
                              }}
                            />
                          </>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// warrior screen function, associated with the individual campaign
function WarriorsScreen({ route, navigation }) {
  const { campaign, onUpdateCampaign, theme, playSound } = route.params;
  const [warriors, setWarriors] = useState(campaign?.warriors || []);
  const [newWarrior, setNewWarrior] = useState({
    name: '',
    desc: '',
    notes: '',
    imageUri: null,
  });
  const [expandedWarriors, setExpandedWarriors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editWarrior, setEditWarrior] = useState({
    name: '',
    desc: '',
    notes: '',
    imageUri: null,
  });

  useEffect(() => {
    setWarriors(campaign.warriors || []);
  }, [campaign.warriors]);

  useEffect(() => {
    AsyncStorage.setItem('activeCampaign', JSON.stringify(campaign));
  }, [campaign]);
  // add warrior
  const addWarrior = async () => {
    if (!newWarrior.name.trim()) return;

    const warrior = {
      id: Date.now().toString(),
      name: newWarrior.name,
      desc: newWarrior.desc,
      notes: newWarrior.notes,
      image: newWarrior.imageUri ? { uri: newWarrior.imageUri } : null,
      time: 0,
    };

    await playSound(theme.sounds.warrior);

    const updated = [...warriors, warrior];
    const updatedCampaign = { ...campaign, warriors: updated };

    setWarriors(updated);
    onUpdateCampaign(updatedCampaign);
    setNewWarrior({ name: '', desc: '', notes: '', imageUri: null });

    const stored = await AsyncStorage.getItem('campaigns');
    if (stored) {
      const parsed = JSON.parse(stored);
      const updatedList = parsed.map((c) =>
        c.id === campaign.id ? updatedCampaign : c
      );
      await AsyncStorage.setItem('campaigns', JSON.stringify(updatedList));
    }
  };
  // delete warrior
  const deleteWarrior = async (id) => {
    await playSound(theme.sounds.warriorRemove);
    const updated = warriors.filter((w) => w.id !== id);
    const updatedCampaign = { ...campaign, warriors: updated };
    setWarriors(updated);
    onUpdateCampaign(updatedCampaign);

    const stored = await AsyncStorage.getItem('campaigns');
    if (stored) {
      const parsed = JSON.parse(stored);
      const updatedList = parsed.map((c) =>
        c.id === campaign.id ? updatedCampaign : c
      );
      await AsyncStorage.setItem('campaigns', JSON.stringify(updatedList));
    }
  };
  // handle the image selected by the user
  const handlePickImage = async (setUri) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUri(result.assets[0].uri);
    }
  };
  // small image of the warrior, with default if none selected
  const CardImage = ({ source, size = 60 }) => {
    const validSource =
      source?.uri || typeof source === 'number'
        ? source
        : theme.images.campaigns_screen; // fallback image

    return (
      <Image
        source={validSource}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          marginVertical: 6,
        }}
        resizeMode="cover"
      />
    );
  };
  // icon pressable button
  const IconButton = ({ icon, label, onPress }) => (
    <Pressable onPress={onPress} style={styles.iconButton}>
      <AntDesign
        name={icon}
        size={20}
        color="white"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.iconButtonText}>{label}</Text>
    </Pressable>
  );
  // save edit of warrior
  const saveEdit = async () => {
    const updated = warriors.map((w) =>
      w.id === editingId
        ? {
            ...w,
            name: editWarrior.name,
            desc: editWarrior.desc,
            notes: editWarrior.notes,
            image: editWarrior.imageUri
              ? { uri: editWarrior.imageUri }
              : w.image,
          }
        : w
    );

    const updatedCampaign = { ...campaign, warriors: updated };
    setWarriors(updated);
    onUpdateCampaign(updatedCampaign);
    setEditingId(null);

    const stored = await AsyncStorage.getItem('campaigns');
    if (stored) {
      const parsed = JSON.parse(stored);
      const updatedList = parsed.map((c) =>
        c.id === campaign.id ? updatedCampaign : c
      );
      await AsyncStorage.setItem('campaigns', JSON.stringify(updatedList));
    }
  };
  // edit warrior
  const startEdit = (warrior) => {
    setEditingId(warrior.id);
    setEditWarrior({
      name: warrior.name,
      desc: warrior.desc,
      notes: warrior.notes,
      imageUri: warrior.image?.uri || null,
    });
  };
  // render warriors
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={theme.images.warriors} style={styles.fullFlex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={60}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.heading}>{campaign.name} - Warriors</Text>
              <View style={styles.card}>
                <Pressable
                  onPress={() =>
                    setExpandedWarriors((prev) => ({
                      ...prev,
                      new: !prev.new,
                    }))
                  }>
                  <Text style={styles.text}>
                    {expandedWarriors.new ? '▼' : '▶'} Add A New Warrior
                  </Text>
                </Pressable>

                {expandedWarriors.new && (
                  <>
                    <TextInput
                      placeholder="Name"
                      value={newWarrior.name}
                      onChangeText={(text) =>
                        setNewWarrior({ ...newWarrior, name: text })
                      }
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Description"
                      value={newWarrior.desc}
                      onChangeText={(text) =>
                        setNewWarrior({ ...newWarrior, desc: text })
                      }
                      style={styles.input}
                    />
                    <TextInput
                      placeholder="Notes"
                      value={newWarrior.notes}
                      onChangeText={(text) =>
                        setNewWarrior({ ...newWarrior, notes: text })
                      }
                      style={styles.input}
                    />
                    <IconButton
                      icon="picture"
                      label="Pick Image"
                      onPress={() =>
                        handlePickImage((uri) =>
                          setNewWarrior({ ...newWarrior, imageUri: uri })
                        )
                      }
                    />
                    <IconButton
                      icon="pluscircle"
                      label="Add Warrior"
                      onPress={addWarrior}
                    />
                  </>
                )}
              </View>
              {warriors.map((w) => {
                const isExpanded = expandedWarriors[w.id];
                return (
                  <View key={w.id} style={styles.card}>
                    <Pressable
                      onPress={() =>
                        setExpandedWarriors((prev) => ({
                          ...prev,
                          [w.id]: !prev[w.id],
                        }))
                      }>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CardImage source={w.image} size={40} />
                        <Text style={[styles.text, { marginLeft: 10 }]}>
                          {isExpanded ? '▼' : '▶'} {w.name}
                        </Text>
                      </View>
                    </Pressable>
                    {isExpanded && (
                      <>
                        {editingId === w.id ? (
                          <>
                            <TextInput
                              value={editWarrior.name}
                              onChangeText={(text) =>
                                setEditWarrior({ ...editWarrior, name: text })
                              }
                              style={styles.input}
                            />
                            <TextInput
                              value={editWarrior.desc}
                              onChangeText={(text) =>
                                setEditWarrior({ ...editWarrior, desc: text })
                              }
                              style={styles.input}
                            />
                            <TextInput
                              value={editWarrior.notes}
                              onChangeText={(text) =>
                                setEditWarrior({ ...editWarrior, notes: text })
                              }
                              style={styles.input}
                            />
                            <IconButton
                              icon="picture"
                              label="Pick Image"
                              onPress={() =>
                                handlePickImage((uri) =>
                                  setEditWarrior({
                                    ...editWarrior,
                                    imageUri: uri,
                                  })
                                )
                              }
                            />
                            <IconButton
                              icon="save"
                              label="Save"
                              onPress={saveEdit}
                            />
                          </>
                        ) : (
                          <>
                            <Text style={styles.text}>{w.desc}</Text>
                            <Text style={styles.text}>📝 {w.notes}</Text>
                            <Text style={styles.text}>⏱ {w.time}s painted</Text>
                            <IconButton
                              icon="edit"
                              label="Edit"
                              onPress={() => startEdit(w)}
                            />
                            <IconButton
                              icon="delete"
                              label="Delete"
                              onPress={() => deleteWarrior(w.id)}
                            />
                          </>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

/*
 * trophy room screen function
 *
 * in future will contain trophies for achievements of the user
 *
 */
function TrophyRoomScreen({ theme }) {
  const [achieved, setAchieved] = useState({});

  const trophies = useMemo(
    () => [
      { id: '1', name: 'First Blood', desc: 'Painted your first warrior!' },
      { id: '2', name: 'Ten Strong', desc: '10 Warriors added to your army.' },
      { id: '3', name: 'Endurance', desc: 'Painted for 1+ hour total.' },
      { id: 'visit', name: 'Welcome!', desc: 'Visited the Trophy Room!' },
    ],
    []
  );

  useEffect(() => {
    const checkTrophies = async () => {
      const stored = await getAchievedTrophies();
      const newAchievements = { ...stored };
      let updated = false;

      // loop all trophies and award visit on first open
      for (let trophy of trophies) {
        if (!stored[trophy.id] && trophy.id === 'visit') {
          const awarded = await awardTrophy(trophy.id, theme);
          playSound(theme.sounds.trophy);
          if (awarded) updated = true;
        }
      }

      if (updated) {
        const refreshed = await getAchievedTrophies();
        setAchieved(refreshed);
      } else {
        setAchieved(stored);
      }
    };

    checkTrophies();
  }, [theme, trophies]);

  return (
    <ImageBackground source={theme.images.trophyRoom} style={styles.container}>
      <Text style={styles.heading}>🏆 Trophy Room</Text>
      <FlatList
        data={trophies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isAchieved = achieved[item.id];
          return (
            <View style={styles.trophyCard}>
              <MaterialIcons name="military-tech" size={48} color="gold" />
              <Text style={styles.trophyText}>
                {item.name} {isAchieved && '✅'}
              </Text>
              <Text style={{ color: 'white' }}>{item.desc}</Text>
            </View>
          );
        }}
      />
    </ImageBackground>
  );
}

// checking storage size for future app store submission
const getAsyncStorageSize = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const stores = await AsyncStorage.multiGet(keys);
  const totalBytes = stores.reduce((acc, [, value]) => {
    return acc + (value ? value.length * 2 : 0); // UTF-16 = 2 bytes per char
  }, 0);
  return totalBytes;
};

// developer screen, with a bunch of buttons to reset data for testing
function DeveloperScreen({ setCampaigns, setActiveCampaign }) {
  const [storageSize, setStorageSize] = useState(0);
  const MAX_STORAGE = 6 * 1024 * 1024; // 6MB = Expo AsyncStorage limit

  useEffect(() => {
    const loadStorageSize = async () => {
      const bytes = await getAsyncStorageSize();
      setStorageSize(bytes);
    };
    const interval = setInterval(loadStorageSize, 3000); // update every 3s
    loadStorageSize(); // initial
    return () => clearInterval(interval);
  }, []);

  const clearAll = async () => {
    await AsyncStorage.clear();
    setCampaigns([]);
    setActiveCampaign(null);
    alert('All data cleared!');
  };

  const clearCampaigns = async () => {
    await AsyncStorage.removeItem('campaigns');
    setCampaigns([]);
    alert('Campaigns cleared!');
  };

  const clearActiveCampaign = async () => {
    await AsyncStorage.removeItem('activeCampaign');
    setActiveCampaign(null);
    alert('Active campaign cleared!');
  };

  const clearAllWarriors = async () => {
    const stored = await AsyncStorage.getItem('campaigns');
    if (stored) {
      const updated = JSON.parse(stored).map((c) => ({
        ...c,
        warriors: [],
      }));
      await AsyncStorage.setItem('campaigns', JSON.stringify(updated));
      setCampaigns(updated);
      alert('🗑 All warrior data cleared!');
    }
  };

  const clearTrophies = async () => {
    await resetTrophies();
    alert('Trophies reset!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.heading, styles.overlayBox]}>🛠 Developer Tools</Text>
      <View style={{ padding: 10 }}>
        <Text style={[styles.heading, styles.overlayBox]}>
          📦 AsyncStorage Usage
        </Text>
        <View
          style={{
            height: 20,
            backgroundColor: '#444',
            borderRadius: 10,
            overflow: 'hidden',
            marginVertical: 6,
          }}>
          <View
            style={{
              height: '100%',
              width: `${Math.min((storageSize / MAX_STORAGE) * 100, 100)}%`,
              backgroundColor:
                storageSize < MAX_STORAGE * 0.5
                  ? '#33FF99'
                  : storageSize < MAX_STORAGE * 0.8
                  ? '#FFA500'
                  : '#FF4444',
            }}
          />
        </View>
        <Text style={{ color: 'white' }}>
          {(storageSize / 1024).toFixed(2)} KB / 6144 KB
        </Text>
      </View>
      <Button title="🧨 Clear All Data" onPress={clearAll} color="red" />
      <View style={{ height: 10 }} />
      <Button title="🗑 Clear Campaigns" onPress={clearCampaigns} />
      <View style={{ height: 10 }} />
      <Button title="🚫 Clear Active Campaign" onPress={clearActiveCampaign} />
      <View style={{ height: 10 }} />
      <Button
        title="🗑 Clear Warrior Data (All Campaigns)"
        onPress={clearAllWarriors}
      />
      <View style={{ height: 10 }} />
      <Button title="🧼 Clear Trophies" onPress={clearTrophies} />
      <View style={{ height: 10 }} />
      <Button
        title="Play Test Sound"
        onPress={() => playSound(theme.sounds.splash)}
      />
    </ScrollView>
  );
}

/*
 * main app function, starting point of the app
 * also now includes hamburger navigation code
 *
 */
export default function App() {
  // state variables
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [ready, setReady] = useState(false);
  const navigationRef = useNavigationContainerRef();
  const [fontsLoaded] = useFonts(theme.fonts);
  // preload the sound file
  useEffect(() => {
    const initAudio = async () => {
      // Preload and play
      await loadSound(theme.sounds.trophy);
      await loadSound(theme.sounds.splash);
      await loadSound(theme.sounds.campaign);
      await loadSound(theme.sounds.campaign2);

      playSound(theme.sounds.splash); // 🔊 Play on app load
    };

    initAudio();
  }, []);
  // set ready flag to true if the splash screen has already been shown
  useEffect(() => {
    if (!showSplash && fontsLoaded) {
      setReady(true);
    }
  }, [showSplash, fontsLoaded]);
  // show splash screen with a 2 second transition
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [contentAnim, fadeAnim]);
  useEffect(() => {
    // background music
    let backgroundSound;
    const playBackgroundMusic = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          theme.music.backgroundMusic,
          {
            isLooping: true,
            volume: 0.25, // lower volume for background
          }
        );
        backgroundSound = sound;
        await backgroundSound.playAsync();
      } catch (e) {
        console.warn('🎵 Error playing background music:', e);
      }
    };
    playBackgroundMusic();
    return () => {
      if (backgroundSound) {
        backgroundSound.unloadAsync();
      }
    };
  }, []);
  // load stored campaign data
  useEffect(() => {
    const loadData = async () => {
      const storedCamps = await AsyncStorage.getItem('campaigns');
      const storedActive = await AsyncStorage.getItem('activeCampaign');

      if (storedCamps) {
        const parsedCamps = JSON.parse(storedCamps);

        const normalizedCamps = parsedCamps.map((c) => ({
          ...c,
          image: c.image || theme.campaigns.defaultImage,
        }));

        setCampaigns(normalizedCamps);

        if (storedActive) {
          const parsedActive = JSON.parse(storedActive);
          const exists = normalizedCamps.find((c) => c.id === parsedActive.id);
          if (exists) {
            setTimeout(() => {
              setActiveCampaign(exists);
            }, 150);
          } else {
            setActiveCampaign(null);
          }
        }
      }
      setReady(true);
    };
    loadData();
  }, []);
  // loads the campaigns data from storage
  useEffect(() => {
    if (campaigns.length > 0) {
      AsyncStorage.setItem('campaigns', JSON.stringify(campaigns));
    }
  }, [campaigns]);
  // loads the currently active campaign from storage
  useEffect(() => {
    if (activeCampaign) {
      AsyncStorage.setItem('activeCampaign', JSON.stringify(activeCampaign));
    }
  }, [activeCampaign]);
  // block all renders until ready
  if (!fontsLoaded) return null;
  // inline drawer navigator for the hamburger menu
  const DrawerNavigator = () => (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        drawerStyle: styles.drawer,
        drawerLabelStyle: styles.drawerLabel,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: styles.headerTitle,
        headerRight: () =>
          activeCampaign ? (
            <TouchableOpacity
              onPress={async () => {
                const latestCamps = await AsyncStorage.getItem('campaigns');
                if (latestCamps) {
                  setCampaigns(JSON.parse(latestCamps));
                }
                navigationRef.current?.navigate('Campaigns');
              }}>
              <Image
                source={activeCampaign.image}
                style={{
                  width: 36,
                  height: 36,
                  marginRight: 12,
                  borderRadius: 6,
                }}
              />
            </TouchableOpacity>
          ) : null,
      }}>
      <Drawer.Screen name="Home">
        {(props) => <HomeScreen {...props} activeCampaign={activeCampaign} />}
      </Drawer.Screen>
      <Drawer.Screen name="Campaigns">
        {(props) => (
          <CampaignsScreen
            {...props}
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            activeCampaign={activeCampaign}
            setActiveCampaign={setActiveCampaign}
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen name="Warriors">
        {(props) =>
          activeCampaign ? (
            <WarriorsScreen
              {...props}
              route={{
                params: {
                  campaign: activeCampaign,
                  onUpdateCampaign: (updated) => {
                    setCampaigns(
                      campaigns.map((c) => (c.id === updated.id ? updated : c))
                    );
                    setActiveCampaign(updated);
                  },
                  theme,
                  playSound,
                },
              }}
            />
          ) : (
            () => (
              <SafeAreaView style={styles.container}>
                <Text style={styles.heading}>No active campaign selected.</Text>
              </SafeAreaView>
            )
          )
        }
      </Drawer.Screen>
      <Drawer.Screen name="Gallery" component={GalleryScreen} />
      <Drawer.Screen name="Color Wheel" component={ColorWheelScreen} />
      <Drawer.Screen name="Trophy Room">
        {(props) => <TrophyRoomScreen {...props} theme={theme} />}
      </Drawer.Screen>
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Developer Tools">
        {(props) => (
          <DeveloperScreen
            {...props}
            setCampaigns={setCampaigns}
            setActiveCampaign={setActiveCampaign}
          />
        )}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
  // render return, showing splash screen when ready and drawer navigator when ready
  return (
    <SafeAreaView style={styles.container}>
      {showSplash && (
        <Animated.View style={{ ...styles.splash, opacity: fadeAnim }}>
          <Image source={theme.images.splash} style={styles.splashImage} />
        </Animated.View>
      )}
      {ready && (
        <NavigationContainer ref={navigationRef}>
          <DrawerNavigator />
        </NavigationContainer>
      )}
    </SafeAreaView>
  );
}

/*
 * Global styles using StyleSheet.create
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  fullFlex: {
    flex: 1,
  },
  splash: {
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 99,
  },
  splashImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  drawer: {
    backgroundColor: theme.colors.overlay,
    width: 240,
    borderRadius: 6,
  },
  drawerLabel: {
    color: theme.colors.text,
    fontFamily: theme.font.primary,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontFamily: theme.font.primary,
  },
  headerBlock: {
    backgroundColor: theme.colors.background,
    flex: 0.5,
  },
  heading: {
    color: theme.colors.text,
    fontSize: 28,
    fontFamily: theme.font.primary,
    paddingHorizontal: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  overlayBox: {
    backgroundColor: theme.colors.overlayStrong,
  },
  helperRow: {
    padding: 10,
    flexDirection: 'row-reverse',
  },
  helperIcon: {
    height: 40,
    width: 40,
    justifyContent: 'right',
    alignSelf: 'flex-end',
  },
  helperText: {
    color: '#33ceff',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    fontSize: 20,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bottomTextBlock: {
    flex: 6,
    justifyContent: 'flex-end',
  },
  infoText: {
    backgroundColor: theme.colors.overlay,
    color: theme.colors.text,
    fontSize: 18,
    textAlign: 'left',
    paddingHorizontal: 15,
    marginVertical: 10,
    borderRadius: 6,
    fontFamily: theme.font.primary,
  },
  subheading: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  input: {
    backgroundColor: 'white',
    marginVertical: 6,
    padding: 10,
    borderRadius: 6,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  trophyCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  trophyText: {
    color: 'white',
  },
  text: {
    color: 'white',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  iconButtonText: {
    color: 'white',
    fontSize: 16,
  },
  launchButton: {
    color: theme.colors.text,
    fontSize: 20,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    margin: 20,
    fontFamily: theme.font.primary,
  },
});