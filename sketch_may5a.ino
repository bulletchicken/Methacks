const int sensorPin1 = A0; 
const int sensorPin2 = A1; 

int pressureValue1; 
int pressureValue2;

void setup() {
  Serial.begin(9600);
}

void loop() {
  pressureValue1 = analogRead(sensorPin1);
  pressureValue2 = analogRead(sensorPin2); 

  Serial.print("Left Side Foot: ");
  Serial.print(pressureValue1);
  Serial.print("\tFront Foot : ");
  Serial.println(pressureValue2);
  delay(200);
  if(pressureValue2 > 100) {
    Serial.println("Don't kick with front foot");  
    delay(1000); }
  else if(pressureValue1 > 300) {
    Serial.println("Great Power");  
    delay(1000); 
    }
  else if(pressureValue1 > 200) {
    Serial.println("Good Power");   
    delay(1000); 
  }
  else if (pressureValue1 > 100){
    Serial.println("A little more power");
    delay(1000);
  }

}
