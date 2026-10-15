# FitMaintenance AI - Audio Assets Directory

This folder contains the audio assets utilized by the **Heavy-Sleeper Bilingual Morning Alarm, Ambient Instrumental, and Devotional Briefing** system.

## Included Audio Assets:
1. **`peaceful-morning-bell.mp3`**:
   - Used for the initial morning wakeup alarm.
   - Serene Tibetan singing bowl resonance and temple bell harmonics.
   - Plays with maximum volume override (`volume = 1.0`) if Heavy-Sleeper Mode is enabled, waking users calmly and peacefully without harsh, jarring beeps.

2. **`ambient-tanpura.mp3`**:
   - Used during the dual-language Web Speech API briefing (English $\rightarrow$ Tamil).
   - Meditative Indian classical Tanpura drone in C# (Pa-Sa-Sa strings).
   - Plays subtly at `volume = 0.2` as a calming backdrop during voice synthesis.

3. **`kandha-sashti-kavasam.mp3` (or `kanda-sashti-kavasam.mp3`)**:
   - Track 1 in the continuous devotional audio queue.
   - Chanted in praise of Lord Murugan for strength, discipline, and health protection.
   - Upon track conclusion (`onended`), the audio player automatically and seamlessly transitions into Sivapuranam.

4. **`sivapuranam.mp3`**:
   - Track 2 in the continuous devotional audio queue.
   - Sacred Thiruvasagam hymnal by Saint Manikkavasagar praising Lord Shiva.

---

### Customizing Your Devotional Tracks:
You can replace `kandha-sashti-kavasam.mp3` and `sivapuranam.mp3` with your preferred full-length renditions (e.g., Soolamangalam Sisters, SPB, or Dharmapuram Swaminathan) simply by dropping the `.mp3` files into this directory.
