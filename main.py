import cv2
from ultralytics import YOLO
import pyttsx3
import time

# ---------------------------
# SPEAK FUNCTION
# ---------------------------
def speak(text):
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    engine.say(text)
    engine.runAndWait()
    engine.stop()

# ---------------------------
# MODEL
# ---------------------------
model = YOLO("yolov8n.pt")
model.to("cpu")

cap = cv2.VideoCapture(0)

last_time = 0
last_states = {}  # 🔥 stores last spoken state

frame_skip = 2  # 🔥 reduce lag

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    if frame_count % frame_skip != 0:
        cv2.imshow("Drishti AI", frame)
        if cv2.waitKey(1) == 27:
            break
        continue

    h, w, _ = frame.shape

    # ---------------------------
    # YOLO
    # ---------------------------
    results = model(frame, conf=0.3, verbose=False)

    messages = []

    for r in results:
        for box in r.boxes:

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = model.names[int(box.cls[0])]

            # ---------------------------
            # DISTANCE (FASTER METHOD)
            # ---------------------------
            area = (x2 - x1) * (y2 - y1)

            if area > 50000:
                distance = "very close"
            elif area > 20000:
                distance = "near"
            else:
                distance = "far"

            # ---------------------------
            # DIRECTION
            # ---------------------------
            cx = (x1 + x2) // 2

            if cx < w // 3:
                direction = "left"
            elif cx < 2 * w // 3:
                direction = "center"
            else:
                direction = "right"

            key = f"{label}_{direction}"
            current_state = distance

            # ---------------------------
            # 🔥 SPEAK ONLY IF STATE CHANGES
            # ---------------------------
            if key not in last_states or last_states[key] != current_state:
                if distance != "far":  # ignore far
                    messages.append(f"{label} {distance} on {direction}")
                    last_states[key] = current_state

            # Draw
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, f"{label} {distance} {direction}",
                        (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

    # ---------------------------
    # 🔊 SPEAK ONLY IF NEW CHANGE
    # ---------------------------
    current_time = time.time()

    if messages and current_time - last_time > 2:
        sentence = ", ".join(messages[:2])
        speak(sentence)
        last_time = current_time

    # ---------------------------
    # DISPLAY
    # ---------------------------
    cv2.imshow("Drishti AI", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()