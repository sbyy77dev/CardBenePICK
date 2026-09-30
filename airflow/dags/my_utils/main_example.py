from repo import get_seven_days_usage, insert_val_notification, get_user_each_card_use_with_performance, update_is_active_false, get_all_user_id_list
import json
# a = insert_val_notification(101, 1, '{"card_name":"shin"}')
a = get_seven_days_usage(10)
print(a)
str(a )
a = get_all_user_id_list()
list(a["user_id"])
card_data_list = get_user_each_card_use_with_performance(1)
cards_data = []
for _ , row in card_data_list.iterrows():
    cards_data.append({"card_name": row['card_name'], "requirement": f"{row['performance']}원", "current_usage": f"{row['current_usage']}원", "image_filename": f"{row['card_id']}card.png"})

str(cards_data)
json_string = json.dumps(cards_data, ensure_ascii=False)
a = insert_val_notification(101, 1, json_string)

a = update_is_active_false()

user_id = 1
card_data_list = get_user_each_card_use_with_performance(user_id)
cards_data = []
for _ , row in card_data_list.iterrows():
    cards_data.append({"card_name": f"{row['card_name']}", "requirement": f"{row['performance']}", "current_usage": f"{row['current_usage']}", "image_filename": f"{row['card_id']}card.png"})
cards_data
import json
json_string = json.dumps(cards_data, ensure_ascii=False)
insert_val_notification(user_id, 1, json_string)