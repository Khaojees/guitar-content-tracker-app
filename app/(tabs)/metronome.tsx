import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
} from 'react-native';
import { Audio } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Slider from '@react-native-community/slider';

export default function MetronomeScreen() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [accentedMode, setAccentedMode] = useState(true);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapStatus, setTapStatus] = useState<{
    isActive: boolean;
    taps: number;
    bpm: number | null;
  }>({
    isActive: false,
    taps: 0,
    bpm: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accentSoundRef = useRef<Audio.Sound | null>(null);
  const regularSoundRef = useRef<Audio.Sound | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        // Create simple beep sounds using Audio
        const { sound: accentSound } = await Audio.Sound.createAsync(
          { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' },
          { shouldPlay: false }
        );
        const { sound: regularSound } = await Audio.Sound.createAsync(
          { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=' },
          { shouldPlay: false }
        );

        accentSoundRef.current = accentSound;
        regularSoundRef.current = regularSound;
      } catch (error) {
        console.error('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      accentSoundRef.current?.unloadAsync();
      regularSoundRef.current?.unloadAsync();
    };
  }, []);

  // Metronome logic
  useEffect(() => {
    if (isPlaying) {
      playClick(accentedMode);
      setBeat(0);

      const interval = 60000 / bpm;
      let currentBeat = beatsPerMeasure > 1 ? 1 : 0;

      intervalRef.current = setInterval(() => {
        const shouldAccent = accentedMode && currentBeat === 0;
        playClick(shouldAccent);
        setBeat(currentBeat);
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, beatsPerMeasure, accentedMode]);

  const playClick = async (isAccent: boolean) => {
    try {
      const sound = isAccent ? accentSoundRef.current : regularSoundRef.current;
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.error('Error playing click:', error);
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const newTapTimes = [...tapTimes, now];

    // Reset if more than 2 seconds since last tap
    if (newTapTimes.length > 1 && now - newTapTimes[newTapTimes.length - 2] > 2000) {
      setTapTimes([now]);
      setTapStatus({ isActive: true, taps: 1, bpm: null });
    } else {
      setTapTimes(newTapTimes);

      // Calculate BPM from taps
      if (newTapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTapTimes.length; i++) {
          intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);

        if (calculatedBpm >= 30 && calculatedBpm <= 300) {
          setBpm(calculatedBpm);
          setTapStatus({
            isActive: true,
            taps: newTapTimes.length,
            bpm: calculatedBpm,
          });
        }
      } else {
        setTapStatus({ isActive: true, taps: 1, bpm: null });
      }
    }

    // Reset after 2 seconds
    tapTimeoutRef.current = setTimeout(() => {
      setTapTimes([]);
      setTapStatus({ isActive: false, taps: 0, bpm: null });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* BPM Display */}
      <View style={styles.bpmContainer}>
        <View style={styles.bpmControls}>
          <TouchableOpacity
            style={[styles.bpmButton, bpm <= 30 && styles.bpmButtonDisabled]}
            onPress={() => setBpm(Math.max(30, bpm - 1))}
            disabled={bpm <= 30}
          >
            <Text style={styles.bpmButtonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.bpmDisplayContainer}>
            <TextInput
              style={styles.bpmDisplay}
              value={String(bpm)}
              onChangeText={(value) => {
                const num = parseInt(value);
                if (!isNaN(num) && num >= 30 && num <= 300) {
                  setBpm(num);
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.bpmLabel}>BPM</Text>
          </View>

          <TouchableOpacity
            style={[styles.bpmButton, bpm >= 300 && styles.bpmButtonDisabled]}
            onPress={() => setBpm(Math.min(300, bpm + 1))}
            disabled={bpm >= 300}
          >
            <Text style={styles.bpmButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={30}
            maximumValue={300}
            value={bpm}
            onValueChange={setBpm}
            minimumTrackTintColor="#6366F1"
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor="#6366F1"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>30</Text>
            <Text style={styles.sliderLabel}>300</Text>
          </View>
        </View>
      </View>

      {/* Beat Indicator */}
      <View style={styles.beatIndicator}>
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <View
            key={i}
            style={[
              styles.beat,
              isPlaying && beat === i && (i === 0 ? styles.beatActiveAccent : styles.beatActive),
            ]}
          />
        ))}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <IconSymbol
            name={isPlaying ? 'pause.circle.fill' : 'play.circle.fill'}
            size={48}
            color="#fff"
          />
          <Text style={styles.playButtonText}>{isPlaying ? 'STOP' : 'START'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tapButton} onPress={handleTapTempo}>
          <IconSymbol name="hand.tap" size={24} color="#6366F1" />
          <Text style={styles.tapButtonText}>TAP TEMPO</Text>
        </TouchableOpacity>

        {tapStatus.isActive && (
          <Text style={styles.tapStatus}>
            {tapStatus.bpm
              ? `≈${tapStatus.bpm} BPM (${tapStatus.taps} tap${tapStatus.taps === 1 ? '' : 's'})`
              : `${tapStatus.taps} tap${tapStatus.taps === 1 ? '' : 's'}`}
          </Text>
        )}
      </View>

      {/* Settings */}
      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Beats per measure</Text>
          <View style={styles.measureControls}>
            <TouchableOpacity
              style={[styles.measureButton, beatsPerMeasure <= 1 && styles.measureButtonDisabled]}
              onPress={() => setBeatsPerMeasure(Math.max(1, beatsPerMeasure - 1))}
              disabled={beatsPerMeasure <= 1}
            >
              <Text style={styles.measureButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.measureValue}>{beatsPerMeasure}</Text>
            <TouchableOpacity
              style={[styles.measureButton, beatsPerMeasure >= 16 && styles.measureButtonDisabled]}
              onPress={() => setBeatsPerMeasure(Math.min(16, beatsPerMeasure + 1))}
              disabled={beatsPerMeasure >= 16}
            >
              <Text style={styles.measureButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Accent first beat</Text>
          <Switch
            value={accentedMode}
            onValueChange={setAccentedMode}
            trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
            thumbColor={accentedMode ? '#6366F1' : '#9CA3AF'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
  },
  bpmContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bpmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  bpmButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpmButtonDisabled: {
    opacity: 0.3,
  },
  bpmButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  bpmDisplayContainer: {
    alignItems: 'center',
    marginHorizontal: 32,
  },
  bpmDisplay: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    minWidth: 160,
  },
  bpmLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  beatIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  beat: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  beatActive: {
    backgroundColor: '#6366F1',
    transform: [{ scale: 1.5 }],
  },
  beatActiveAccent: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.8 }],
  },
  controls: {
    alignItems: 'center',
    marginBottom: 32,
  },
  playButton: {
    backgroundColor: '#6366F1',
    borderRadius: 32,
    paddingVertical: 20,
    paddingHorizontal: 48,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonActive: {
    backgroundColor: '#EF4444',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: '#fff',
  },
  tapButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  tapStatus: {
    marginTop: 8,
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
  settings: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  measureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  measureButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureButtonDisabled: {
    opacity: 0.3,
  },
  measureButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  measureValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    minWidth: 32,
    textAlign: 'center',
  },
});
