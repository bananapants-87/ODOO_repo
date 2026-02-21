import re

def check_password_strength(password):
    score = 0
    
    # Length check
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1

    # Uppercase
    if re.search(r"[A-Z]", password):
        score += 1

    # Lowercase
    if re.search(r"[a-z]", password):
        score += 1

    # Digit
    if re.search(r"[0-9]", password):
        score += 1

    # Special character
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        score += 1

    # Strength rating
    if score <= 2:
        return "Weak"
    elif score <= 4:
        return "Moderate"
    else:
        return "Strong"


if __name__ == "__main__":
    user_password = input("Enter your password: ")
    strength = check_password_strength(user_password)
    print("Password Strength:", strength)