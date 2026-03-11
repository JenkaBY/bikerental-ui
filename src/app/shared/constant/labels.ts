// This class is used to keep labels to be translated
// the rule of usage is:
// 1. case of constant name depends on the storing value
// 2. any signs or spaces are omitted
//  Ex. Save = $localize`Save`;
//      save = $localize`save`;
//      CreateStatus = $localize`Create Status`;
//
export class Labels {
  static readonly Save = $localize`Save`;
  static readonly Saving = $localize`Saving...`;
  static readonly Cancel = $localize`Cancel`;
  static readonly Description = $localize`Description`;
  static readonly Name = $localize`Name`;
  static readonly Slug = $localize`Slug`;
  static readonly Close = $localize`Close`;
  static readonly Edit = $localize`Edit`;
  static readonly Create = $localize`Create`;
  static readonly EditStatus = $localize`Edit Status`;
  static readonly CreateStatus = $localize`Create Status`;
  static readonly AllowedTransitions = $localize`Allowed Transitions`;

  static readonly SerialNumber = $localize`Serial Number`;
  static readonly Uid = $localize`UID`;
  static readonly Type = $localize`Type`;
  static readonly Status = $localize`Status`;
  static readonly Model = $localize`Model`;
  static readonly CommissionedAt = $localize`Commissioned At`;
  static readonly Condition = $localize`Condition`;
  static readonly CreateEquipment = $localize`Create Equipment`;
  static readonly EditEquipment = $localize`Edit Equipment`;
  static readonly FormatDate = $localize`Format Date:`;
}
